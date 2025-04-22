# src/github_api.py
import os
import httpx
import json
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# GitHub configuration
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO", "yourusername/your-repo-name")
WORKFLOW_ID = os.getenv("GITHUB_WORKFLOW_ID", "terraform-deploy.yml")
STACK_WORKFLOW_ID = os.getenv("GITHUB_STACK_WORKFLOW_ID", "terraform-stack-deploy.yml")
DRIFT_CHECK_WORKFLOW_ID = os.getenv("GITHUB_DRIFT_CHECK_WORKFLOW_ID", "terraform-drift-check.yml")

async def trigger_infrastructure_deployment(
    resource_type: str,
    name: str,
    environment: str,
    region: str = "eu-west-2",
    deployment_params: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Trigger the GitHub Actions workflow to deploy infrastructure
    
    Args:
        resource_type: Type of resource (ec2_instance, s3_bucket)
        name: Name for the resource
        environment: Environment (dev, staging, prod)
        region: AWS region
        deployment_params: Additional parameters specific to the resource type
    
    Returns:
        Dict with deployment details
    """
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN environment variable is not set")
    
    # Set default params if none provided
    if deployment_params is None:
        deployment_params = {}
    
    # Base inputs for all deployments
    inputs = {
        "resource_type": resource_type,
        "name": name,
        "environment": environment,
        "region": region
    }
    
    # Add resource-specific parameters
    if resource_type == "ec2_instance":
        inputs.update({
            "instance_type": deployment_params.get("instance_type", "t2.micro"),
            "volume_size": deployment_params.get("volume_size", "20"),
            "assign_eip": deployment_params.get("assign_eip", "true"),
            "subnet_id": deployment_params.get("subnet_id", "subnet-07759e500cfdfb6b2")
        })
    elif resource_type == "s3_bucket":
        inputs.update({
            "bucket_name": deployment_params.get("bucket_name"),
            "versioning_enabled": deployment_params.get("versioning_enabled", "false")
        })
    
    # Payload for GitHub API
    payload = {
        "ref": "main",  # Branch where the workflow is defined
        "inputs": inputs
    }
    
    # Headers for GitHub API
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {GITHUB_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Trigger the workflow via GitHub API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/{WORKFLOW_ID}/dispatches",
            headers=headers,
            json=payload
        )
    
    if response.status_code == 204:
        # Generate a deployment ID (GitHub doesn't return one)
        from datetime import datetime
        import uuid
        
        deployment_id = f"deploy-{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:8]}"
        
        # Save deployment in database
        from src.supabase import save_deployment
        
        save_deployment({
            "id": deployment_id,
            "resource_type": resource_type,
            "name": name,
            "environment": environment,
            "region": region,
            "status": "pending",
            "parameters": inputs,
            "created_at": datetime.utcnow().isoformat()
        })
        
        return {
            "deployment_id": deployment_id,
            "status": "pending",
            "message": "Deployment triggered successfully"
        }
    else:
        raise Exception(f"Failed to trigger workflow: {response.status_code} - {response.text}")

async def trigger_stack_deployment(
    stack_config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Trigger the GitHub Actions workflow to deploy a stack of infrastructure resources
    
    Args:
        stack_config: Configuration for the stack deployment
            - stack_id: Unique identifier for the stack
            - resources: List of resources with their configurations and dependencies
    
    Returns:
        Dict with deployment details
    """
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN environment variable is not set")
    
    # Payload for GitHub API
    payload = {
        "ref": "main",  # Branch where the workflow is defined
        "inputs": {
            "stack_id": stack_config["stack_id"],
            "resources_json": json.dumps(stack_config["resources"])
        }
    }
    
    # Headers for GitHub API
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {GITHUB_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Trigger the workflow via GitHub API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/{STACK_WORKFLOW_ID}/dispatches",
            headers=headers,
            json=payload
        )
    
    if response.status_code == 204:
        # Stack ID is already generated in terraform.py
        stack_id = stack_config["stack_id"]
        
        # Return the deployment details
        return {
            "deployment_id": stack_id,
            "status": "pending",
            "message": f"Stack deployment triggered successfully with {len(stack_config['resources'])} resources"
        }
    else:
        raise Exception(f"Failed to trigger stack workflow: {response.status_code} - {response.text}")

async def trigger_drift_detection(
    drift_config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Trigger the GitHub Actions workflow to check for infrastructure drift
    
    Args:
        drift_config: Configuration for the drift detection
            - stack_id: Unique identifier for the stack
            - state_file: Information about the Terraform state file
    
    Returns:
        Dict with drift check details
    """
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN environment variable is not set")
    
    # Extract state file information
    state_file = drift_config.get("state_file", {})
    
    # Payload for GitHub API
    payload = {
        "ref": "main",  # Branch where the workflow is defined
        "inputs": {
            "stack_id": drift_config["stack_id"],
            "state_file_bucket": state_file.get("bucket", ""),
            "state_file_key": state_file.get("key", ""),
            "state_file_region": state_file.get("region", "eu-west-2")
        }
    }
    
    # Headers for GitHub API
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {GITHUB_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Trigger the workflow via GitHub API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/{DRIFT_CHECK_WORKFLOW_ID}/dispatches",
            headers=headers,
            json=payload
        )
    
    if response.status_code == 204:
        # Generate a unique ID for this drift check
        drift_check_id = f"drift-{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:8]}"
        
        # Return the drift check details
        return {
            "drift_check_id": drift_check_id,
            "stack_id": drift_config["stack_id"],
            "status": "pending",
            "message": "Drift detection initiated"
        }
    else:
        raise Exception(f"Failed to trigger drift check workflow: {response.status_code} - {response.text}")