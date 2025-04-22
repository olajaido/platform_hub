import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL", "https://example.supabase.co")
supabase_key = os.getenv("SUPABASE_KEY", "your-supabase-key")

# For development purposes only - use mock client if no credentials
if supabase_url == "https://example.supabase.co" or supabase_key == "your-supabase-key":
    print("WARNING: Using mock Supabase client. Set SUPABASE_URL and SUPABASE_KEY environment variables for production.")

supabase: Client = create_client(supabase_url, supabase_key)

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
    """Save a deployment to Supabase"""
    try:
        response = supabase.table("deployments").insert(deployment_data).execute()
        return response.data
    except Exception as e:
        print(f"Error saving deployment: {str(e)}")
        raise

def update_deployment(deployment_id, update_data):
    """Update a deployment in Supabase"""
    response = supabase.table("deployments").update(update_data).eq("id", deployment_id).execute()
    return response.data

def get_deployments():
    """Get all deployments from Supabase"""
    response = supabase.table("deployments").select("*").order("created_at", desc=True).execute()
    return response.data

def get_deployment(deployment_id):
    """Get a deployment from Supabase by ID"""
    response = supabase.table("deployments").select("*").eq("id", deployment_id).execute()
    deployments = response.data
    
    if not deployments or len(deployments) == 0:
        return None
    
    return deployments[0]
def update_stalled_deployments():
    """Find and update deployments that have been pending for too long"""
    # Get deployments that have been pending for more than 10 minutes
    response = supabase.rpc(
        "update_stalled_deployments",
        {
            "timeout_minutes": 10,
            "new_status": "failed",
            "error_message": "Deployment timed out - no response from workflow"
        }
    ).execute()
    
    return response.data

async def save_stack_deployment(stack_data):
    """Save a stack deployment to Supabase"""
    try:
        response = supabase.table("stack_deployments").insert(stack_data).execute()
        return response.data
    except Exception as e:
        print(f"Error saving stack deployment: {str(e)}")
        raise

async def update_stack_deployment(stack_id, update_data):
    """Update a stack deployment in Supabase"""
    response = supabase.table("stack_deployments").update(update_data).eq("id", stack_id).execute()
    return response.data

def get_stack_deployments():
    """Get all stack deployments from Supabase"""
    response = supabase.table("stack_deployments").select("*").order("created_at", desc=True).execute()
    return response.data

def get_stack_deployment(stack_id):
    """Get a stack deployment from Supabase by ID"""
    response = supabase.table("stack_deployments").select("*").eq("id", stack_id).execute()
    stack_deployments = response.data
    
    if not stack_deployments or len(stack_deployments) == 0:
        return None
    
    return stack_deployments[0]

def get_stack_resources(stack_id):
    """Get all resources in a stack deployment"""
    stack = get_stack_deployment(stack_id)
    if not stack:
        return []
    
    return stack.get("resources", [])