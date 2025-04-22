from fastapi import FastAPI, Depends, HTTPException, status, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import uvicorn
import os
import asyncio
from typing import List, Optional, Dict, Any
from datetime import timedelta, datetime

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
    """Get detailed status of a specific deployment"""
    from src.supabase import get_deployment
    
    deployment = get_deployment(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Return comprehensive deployment information
    return {
        "deployment_id": deployment["id"],
        "resource_type": deployment.get("resource_type", ""),
        "name": deployment.get("name", ""),
        "environment": deployment.get("environment", ""),
        "region": deployment.get("region", ""),
        "status": deployment.get("status", ""),
        "outputs": deployment.get("outputs", {}),
        "parameters": deployment.get("parameters", {}),
        "created_at": deployment.get("created_at", ""),
        "completed_at": deployment.get("completed_at", ""),
        "error_message": deployment.get("error_message", "")
    }

@app.get("/api/deployments/{deployment_id}/logs")
async def get_deployment_logs(
    deployment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get logs for a specific deployment"""
    from src.supabase import get_deployment
    
    deployment = get_deployment(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Initialize with standard log entries based on status
    logs = []
    
    # Add initialization log
    if deployment.get("created_at"):
        logs.append(f"[{deployment.get('created_at')}] Deployment initiated for {deployment.get('resource_type')} '{deployment.get('name')}'")
    
    # Add status-based logs
    status = deployment.get("status", "")
    if status == "pending":
        logs.append(f"Deployment is waiting to be processed by GitHub Actions")
    elif status == "in_progress":
        logs.append(f"Deployment is currently being processed")
    elif status == "completed":
        completed_at = deployment.get("completed_at", "")
        logs.append(f"[{completed_at}] Deployment completed successfully")
        
        # Add outputs as logs
        outputs = deployment.get("outputs", {})
        if outputs:
            logs.append("Deployment outputs:")
            for key, value in outputs.items():
                logs.append(f"  {key}: {value}")
    elif status == "failed":
        error_msg = deployment.get("error_message", "Unknown error")
        logs.append(f"Deployment failed: {error_msg}")
    
    # Get additional logs if stored
    stored_logs = deployment.get("logs", [])
    if stored_logs:
        logs.extend(stored_logs)
    
    return {"logs": logs}

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
    try:
        # Verify webhook secret
        webhook_secret = os.getenv("WEBHOOK_SECRET")
        if not webhook_secret or data.get("secret") != webhook_secret:
            raise HTTPException(status_code=403, detail="Invalid webhook secret")
            
        deployment_id = data.get("deployment_id")
        if not deployment_id:
            raise HTTPException(status_code=400, detail="Missing deployment_id")
            
        from src.supabase import update_deployment, save_deployment, get_deployment
        
        # Enhanced error handling for required fields
        for field in ["resource_type", "name", "environment", "region", "status"]:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        update_data = {
            "resource_type": data.get("resource_type"),
            "name": data.get("name"),
            "environment": data.get("environment"),
            "region": data.get("region"),
            "status": data.get("status"),
            "outputs": data.get("outputs", {}),
            "completed_at": data.get("completed_at"),
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        # Add error message if present
        if "error_message" in data:
            update_data["error_message"] = data.get("error_message")
            
        # Process additional logs if present
        if "logs" in data and isinstance(data["logs"], list):
            update_data["logs"] = data.get("logs")
        
        # Check if the deployment exists
        existing_deployment = get_deployment(deployment_id)
        
        if not existing_deployment:
            # Create new deployment record
            update_data["id"] = deployment_id
            update_data["created_at"] = data.get("created_at") or datetime.utcnow().isoformat()
            save_deployment(update_data)
        else:
            # Update existing deployment
            update_deployment(deployment_id, update_data)
        
        # Trigger websocket notifications (will be implemented later)
        
        return {"status": "ok", "message": "Webhook processed successfully"}
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return 500
        print(f"Error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook: {str(e)}"
        )

# WebSocket connection for real-time deployment updates
@app.websocket("/ws/deployments/{deployment_id}")
async def websocket_deployment(websocket: WebSocket, deployment_id: str):
    await websocket.accept()
    
    try:
        # Send initial deployment status
        from src.supabase import get_deployment
        deployment = get_deployment(deployment_id)
        
        if not deployment:
            await websocket.send_json({"error": "Deployment not found"})
            await websocket.close()
            return
            
        await websocket.send_json({
            "type": "status_update",
            "data": {
                "deployment_id": deployment.get("id"),
                "status": deployment.get("status"),
                "outputs": deployment.get("outputs", {})
            }
        })
        
        # Keep connection open and periodically check for updates
        while True:
            # Re-fetch deployment every 3 seconds
            await asyncio.sleep(3)
            current_deployment = get_deployment(deployment_id)
            
            if not current_deployment:
                await websocket.send_json({"error": "Deployment no longer exists"})
                break
                
            # Send update only if status changed
            if current_deployment.get("status") != deployment.get("status"):
                await websocket.send_json({
                    "type": "status_update",
                    "data": {
                        "deployment_id": current_deployment.get("id"),
                        "status": current_deployment.get("status"),
                        "outputs": current_deployment.get("outputs", {})
                    }
                })
                
                # If deployment completed or failed, send final message and close
                if current_deployment.get("status") in ["completed", "failed"]:
                    await websocket.send_json({
                        "type": "deployment_finished",
                        "data": {
                            "status": current_deployment.get("status"),
                            "completed_at": current_deployment.get("completed_at")
                        }
                    })
                    break
                    
            deployment = current_deployment
            
    except WebSocketDisconnect:
        # Client disconnected
        pass
    except Exception as e:
        # Try to send error message before closing
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
    finally:
        # Ensure connection is closed
        try:
            await websocket.close()
        except:
            pass

# Background task to check for stalled deployments
async def check_stalled_deployments():
    while True:
        try:
            from src.supabase import update_stalled_deployments
            
            # Check every minute
            await asyncio.sleep(60)
            result = update_stalled_deployments()
            if result and len(result) > 0:
                print(f"Updated {len(result)} stalled deployments")
        except Exception as e:
            print(f"Error checking stalled deployments: {str(e)}")

# Startup event to initialize background tasks
@app.on_event("startup")
async def startup_event():
    # Start background task for checking stalled deployments
    asyncio.create_task(check_stalled_deployments())

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)