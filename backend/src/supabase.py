import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

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