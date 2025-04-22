import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

# In-memory cache for frequently accessed deployments
# Format: {deployment_id: {"data": deployment_data, "expires_at": timestamp}}
_deployment_cache = {}

def get_user_by_username(username: str):
    """Get a user from Supabase by username"""
    response = supabase.table("users").select("*").eq("username", username).execute()
    users = response.data
    
    if not users or len(users) == 0:
        return None
    
    return users[0]

def get_users():
    """Get all users from Supabase"""
    response = supabase.table("users").select("*").execute()
    return response.data

def create_user(username: str, email: str, password: str, role: str = "user"):
    """Create a new user in Supabase"""
    response = supabase.table("users").insert({
        "username": username,
        "email": email,
        "password": password,
        "role": role
    }).execute()
    
    return response.data

def save_deployment(deployment_data):
    """Save a deployment to Supabase with enhanced error handling and caching"""
    try:
        # Ensure JSON serializable for outputs and parameters
        if "outputs" in deployment_data and isinstance(deployment_data["outputs"], dict):
            # Ensure all values are strings for consistent storage
            deployment_data["outputs"] = {
                k: str(v) for k, v in deployment_data["outputs"].items()
            }
            
        if "parameters" in deployment_data and isinstance(deployment_data["parameters"], dict):
            # Ensure all values are strings for consistent storage
            deployment_data["parameters"] = {
                k: str(v) if not isinstance(v, dict) else json.dumps(v) 
                for k, v in deployment_data["parameters"].items()
            }
            
        # Add timestamp if not present
        if "created_at" not in deployment_data:
            deployment_data["created_at"] = datetime.utcnow().isoformat()
            
        response = supabase.table("deployments").insert(deployment_data).execute()
        
        # Update cache with new deployment
        if "id" in deployment_data:
            cache_deployment(deployment_data["id"], response.data[0] if response.data else deployment_data)
            
        return response.data
    except Exception as e:
        print(f"Error saving deployment: {str(e)}")
        raise

def update_deployment(deployment_id, update_data):
    """Update a deployment in Supabase with cache invalidation"""
    try:
        # Ensure JSON serializable for outputs
        if "outputs" in update_data and isinstance(update_data["outputs"], dict):
            update_data["outputs"] = {
                k: str(v) for k, v in update_data["outputs"].items()
            }
            
        # Add updated_at timestamp if not present
        if "updated_at" not in update_data:
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
        response = supabase.table("deployments").update(update_data).eq("id", deployment_id).execute()
        
        # Invalidate cache for this deployment
        invalidate_deployment_cache(deployment_id)
        
        return response.data
    except Exception as e:
        print(f"Error updating deployment: {str(e)}")
        raise

def get_deployments():
    """Get all deployments from Supabase with improved ordering"""
    try:
        response = supabase.table("deployments")\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(100)\
            .execute()
        return response.data
    except Exception as e:
        print(f"Error fetching deployments: {str(e)}")
        return []

def get_deployment(deployment_id):
    """Get a deployment from Supabase by ID with caching"""
    # Check cache first
    cached = get_cached_deployment(deployment_id)
    if cached:
        return cached
    
    try:
        response = supabase.table("deployments").select("*").eq("id", deployment_id).execute()
        deployments = response.data
        
        if not deployments or len(deployments) == 0:
            return None
        
        # Cache the result
        cache_deployment(deployment_id, deployments[0])
        
        return deployments[0]
    except Exception as e:
        print(f"Error fetching deployment {deployment_id}: {str(e)}")
        return None

def update_stalled_deployments():
    """Find and update deployments that have been pending for too long"""
    try:
        # Get pending deployments
        pending_response = supabase.table("deployments")\
            .select("*")\
            .eq("status", "pending")\
            .execute()
            
        pending_deployments = pending_response.data
        
        # Get current time
        now = datetime.utcnow()
        updated_count = 0
        
        for deployment in pending_deployments:
            try:
                # Skip if no created_at timestamp
                if "created_at" not in deployment:
                    continue
                    
                # Parse created_at timestamp
                created_at = datetime.fromisoformat(deployment["created_at"].replace("Z", "+00:00"))
                
                # If pending for more than 10 minutes, mark as failed
                if (now - created_at) > timedelta(minutes=10):
                    update_deployment(deployment["id"], {
                        "status": "failed",
                        "error_message": "Deployment timed out - no response from workflow",
                        "completed_at": now.isoformat()
                    })
                    updated_count += 1
            except Exception as inner_e:
                print(f"Error processing stalled deployment {deployment.get('id')}: {str(inner_e)}")
                continue
                
        return {"updated_count": updated_count}
    except Exception as e:
        print(f"Error updating stalled deployments: {str(e)}")
        return {"error": str(e)}

def add_deployment_logs(deployment_id, logs):
    """Add logs to a deployment"""
    if not logs or not isinstance(logs, list):
        return None
        
    try:
        # Get current deployment
        deployment = get_deployment(deployment_id)
        if not deployment:
            return None
            
        # Get existing logs
        existing_logs = deployment.get("logs", [])
        
        # Append new logs
        updated_logs = existing_logs + logs
        
        # Update deployment
        update_data = {"logs": updated_logs}
        response = update_deployment(deployment_id, update_data)
        
        return response
    except Exception as e:
        print(f"Error adding logs to deployment {deployment_id}: {str(e)}")
        return None

# Cache management functions
def cache_deployment(deployment_id, deployment_data):
    """Cache a deployment for 30 seconds"""
    expiry = datetime.utcnow() + timedelta(seconds=30)
    _deployment_cache[deployment_id] = {
        "data": deployment_data,
        "expires_at": expiry
    }

def get_cached_deployment(deployment_id):
    """Get a deployment from cache if not expired"""
    if deployment_id not in _deployment_cache:
        return None
        
    cache_entry = _deployment_cache[deployment_id]
    
    # Return None if expired
    if datetime.utcnow() > cache_entry["expires_at"]:
        del _deployment_cache[deployment_id]
        return None
        
    return cache_entry["data"]

def invalidate_deployment_cache(deployment_id):
    """Remove a deployment from cache"""
    if deployment_id in _deployment_cache:
        del _deployment_cache[deployment_id]