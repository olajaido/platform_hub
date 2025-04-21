from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import uvicorn
import os
from typing import List, Optional
from datetime import timedelta

# Import modules - fixed imports
from src.auth import verify_token, get_current_user, create_access_token, authenticate_user, User, ACCESS_TOKEN_EXPIRE_MINUTES
from src.terraform import execute_terraform
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Infrastructure Provisioning API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class User(BaseModel):
    username: str
    email: Optional[str] = None
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ResourceRequest(BaseModel):
    resource_type: str
    size: str
    region: str
    parameters: dict
class DeploymentRequest(BaseModel):
    resource_type: str
    name: str
    environment: str
    region: str = "eu-west-2"
    parameters: dict = {}    

class DeploymentResponse(BaseModel):
    request_id: str
    status: str
    message: str

# Helper function to verify passwords
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
# Routes
@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/api/resources", response_model=DeploymentResponse)
async def create_resource(
    request: ResourceRequest, 
    current_user: User = Depends(get_current_user)
):
    # Check if user has permission based on role
    if current_user.role not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to provision resources"
        )
    result = await execute_terraform(
        resource_type=request.resource_type,
        params={
            "size": request.size,
            "region": request.region,
            "parameters": request.parameters
        }
    )
    return DeploymentResponse(
        request_id=result["deployment_id"],
        status=result["status"],
        message=result["message"]
    )
@app.get("/api/deployments")
async def get_deployments_endpoint(current_user: User = Depends(get_current_user)):
    """Get all deployments for the current user"""
    # Get deployments from Supabase instead of the in-memory database
    from src.supabase import get_deployments
    
    deployments = get_deployments()
    return {"deployments": deployments}

@app.get("/api/deployments/{deployment_id}/status")
async def get_deployment_status(
    deployment_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get actual deployment status from Supabase
    from src.supabase import get_deployment
    
    deployment = get_deployment(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
        
    return {
        "deployment_id": deployment["id"],
        "status": deployment["status"],
        "created_at": deployment["created_at"],
        "completed_at": deployment.get("completed_at")
    }

@app.post("/api/deployments/create", response_model=DeploymentResponse)
async def create_deployment(
    request: DeploymentRequest,
    current_user: User = Depends(get_current_user)
):
    """Trigger an infrastructure deployment through GitHub Actions"""
    # Check if user has permission
    if current_user.role not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to provision resources"
        )
    
    try:
        from src.github_api import trigger_infrastructure_deployment
        
        result = await trigger_infrastructure_deployment(
            resource_type=request.resource_type,
            name=request.name,
            environment=request.environment,
            region=request.region,
            deployment_params=request.parameters
        )
        
        return DeploymentResponse(
            request_id=result["deployment_id"],
            status="pending",
            message="Deployment initiated successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/api/webhook/deployment")
async def deployment_webhook(data: dict):
    """Receive deployment updates from GitHub Actions"""
    # Verify a shared secret
    webhook_secret = os.getenv("WEBHOOK_SECRET")
    if data.get("secret") != webhook_secret:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")
        
    deployment_id = data.get("deployment_id")
    from src.supabase import update_deployment, save_deployment, get_deployment
    
    update_data = {
        "resource_type": data.get("resource_type"),
        "name": data.get("name"),
        "environment": data.get("environment"),
        "region": data.get("region"),
        "status": data.get("status"),
        "outputs": data.get("outputs", {}),
        "completed_at": data.get("completed_at")
    }
    
    # Check if the deployment exists
    existing_deployment = get_deployment(deployment_id)
    
    if not existing_deployment:
        # Create new deployment record
        update_data["id"] = deployment_id
        update_data["created_at"] = data.get("created_at")
        save_deployment(update_data)
    else:
        # Update existing deployment
        update_deployment(deployment_id, update_data)
    
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)