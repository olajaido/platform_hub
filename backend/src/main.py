from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import uvicorn
import os
from typing import List, Optional, Dict, Any
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

class ResourceDefinition(BaseModel):
    resource_type: str
    name: str
    environment: str
    region: str = "eu-west-2"
    parameters: Dict[str, Any] = {}
    dependencies: List[str] = []

class StackDeploymentRequest(BaseModel):
    resources: List[ResourceDefinition]

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
    webhook_secret = os.getenv("WEBHOOK_SECRET", "dev-webhook-secret-123")
    if data.get("secret") != webhook_secret:
        logger.warning(f"Invalid webhook secret: {data.get('secret')} vs {webhook_secret}")
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

@app.post("/api/deployments/create-stack", response_model=DeploymentResponse)
async def create_infrastructure_stack(
    request: StackDeploymentRequest,
    current_user: User = Depends(get_current_user)
):
    """Deploy a stack of multiple infrastructure resources with dependencies"""
    # Check if user has permission
    if current_user.role not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to provision resources"
        )
    
    try:
        # Import here to avoid circular imports
        from src.terraform import execute_terraform_stack
        
        # Process the stack deployment
        result = await execute_terraform_stack(
            resources=request.resources
        )
        
        return DeploymentResponse(
            request_id=result["deployment_id"],
            status="pending",
            message=f"Stack deployment initiated with {len(request.resources)} resources"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/api/webhook/stack-deployment")
async def stack_deployment_webhook(data: dict):
    """Receive stack deployment updates from GitHub Actions"""
    # Verify a shared secret
    webhook_secret = os.getenv("WEBHOOK_SECRET", "dev-webhook-secret-123")
    if data.get("secret") != webhook_secret:
        logger.warning(f"Invalid webhook secret: {data.get('secret')} vs {webhook_secret}")
        raise HTTPException(status_code=403, detail="Invalid webhook secret")
        
    stack_id = data.get("stack_id")
    from src.supabase import update_stack_deployment, save_stack_deployment, get_stack_deployment, update_stack_resource
    
    # Update the overall stack status
    update_data = {
        "status": data.get("status"),
        "outputs": data.get("outputs", {}),
        "completed_at": data.get("completed_at") if data.get("status") in ["completed", "failed"] else None,
        "state_version": data.get("state_version", 1)  # Track state file version
    }
    
    # Check if the stack deployment exists
    existing_stack = get_stack_deployment(stack_id)
    
    if not existing_stack:
        # Create new stack deployment record
        update_data["id"] = stack_id
        update_data["created_at"] = data.get("created_at")
        save_stack_deployment(update_data)
    else:
        # Update existing stack deployment
        update_stack_deployment(stack_id, update_data)
    
    # Update individual resource statuses if provided
    if "resources" in data and isinstance(data["resources"], list):
        for resource in data["resources"]:
            resource_id = resource.get("id")
            if resource_id:
                resource_update = {
                    "status": resource.get("status"),
                    "outputs": resource.get("outputs", {}),
                    "completed_at": resource.get("completed_at") if resource.get("status") in ["completed", "failed"] else None
                }
                update_stack_resource(stack_id, resource_id, resource_update)
    
    return {"status": "ok"}

@app.get("/api/stacks/{stack_id}/status")
async def get_stack_status(
    stack_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get the status of a stack deployment and all its resources"""
    from src.supabase import get_stack_deployment, get_stack_resources
    
    # Get the stack deployment
    stack = get_stack_deployment(stack_id)
    if not stack:
        raise HTTPException(status_code=404, detail="Stack deployment not found")
    
    # Get all resources in the stack
    resources = get_stack_resources(stack_id)
    
    return {
        "stack_id": stack_id,
        "status": stack.get("status", "pending"),
        "created_at": stack.get("created_at"),
        "completed_at": stack.get("completed_at"),
        "outputs": stack.get("outputs", {}),
        "resources": resources
    }

@app.post("/api/webhook/drift-check")
async def drift_check_webhook(data: dict):
    """Receive drift check results from GitHub Actions"""
    # Verify a shared secret
    webhook_secret = os.getenv("WEBHOOK_SECRET", "dev-webhook-secret-123")
    if data.get("secret") != webhook_secret:
        logger.warning(f"Invalid webhook secret: {data.get('secret')} vs {webhook_secret}")
        raise HTTPException(status_code=403, detail="Invalid webhook secret")
        
    stack_id = data.get("stack_id")
    from src.supabase import update_stack_deployment, get_stack_deployment
    
    # Get the stack deployment
    stack = get_stack_deployment(stack_id)
    if not stack:
        raise HTTPException(status_code=404, detail="Stack deployment not found")
    
    # Update the stack with drift information
    update_data = {
        "drift_detected": data.get("drift_detected", False),
        "drift_message": data.get("message", ""),
        "drift_summary": data.get("summary", ""),
        "last_drift_check": data.get("checked_at")
    }
    
    # Update the stack deployment
    update_stack_deployment(stack_id, update_data)
    
    return {"status": "ok"}

@app.post("/api/stacks/{stack_id}/check-drift")
async def check_infrastructure_drift(
    stack_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check for infrastructure drift by comparing the current state with the desired state"""
    # Check if user has permission
    if current_user.role not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to check infrastructure drift"
        )
    
    from src.supabase import get_stack_deployment
    
    # Get the stack deployment
    stack = get_stack_deployment(stack_id)
    if not stack:
        raise HTTPException(status_code=404, detail="Stack deployment not found")
    
    # Get state file location
    state_file = stack.get("state_file")
    if not state_file:
        raise HTTPException(status_code=400, detail="No state file information available for this stack")
    
    # Trigger a plan-only workflow to check for drift
    from src.github_api import trigger_drift_detection
    
    result = await trigger_drift_detection({
        "stack_id": stack_id,
        "state_file": state_file
    })
    
    return {
        "stack_id": stack_id,
        "drift_check_id": result.get("drift_check_id"),
        "message": "Drift detection initiated"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)