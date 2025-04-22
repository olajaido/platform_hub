# src/github_api.py
import os
import httpx
import json
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# GitHub configuration
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO", "yourusername/your-repo-name")
WORKFLOW_ID = os.getenv("GITHUB_WORKFLOW_ID", "terraform-deploy.yml")

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
    
    # Add subnet_id as it's a special parameter that can be passed directly
    if "subnet_id" in deployment_params:
        inputs["subnet_id"] = deployment_params.get("subnet_id")
    
    # Create resource-specific config JSON
    config = {}
    
    # Add resource-specific parameters to config
    if resource_type == "ec2_instance":
        config.update({
            "instance_type": deployment_params.get("instance_type", "t2.micro"),
            "volume_size": deployment_params.get("volume_size", "20"),
            "assign_eip": deployment_params.get("assign_eip", "true")
        })
    elif resource_type == "s3_bucket":
        config.update({
            "bucket_name": deployment_params.get("bucket_name"),
            "versioning_enabled": deployment_params.get("versioning_enabled", "false")
        })
    elif resource_type == "rds_instance":
        config.update({
            "engine": deployment_params.get("engine", "mysql"),
            "engine_version": deployment_params.get("engine_version", "8.0"),
            "instance_class": deployment_params.get("instance_class", "db.t3.micro"),
            "allocated_storage": deployment_params.get("allocated_storage", "20"),
            "master_username": deployment_params.get("master_username", "admin"),
            "multi_az": deployment_params.get("multi_az", "false")
        })
    elif resource_type == "ecs_service":
        config.update({
            "container_image": deployment_params.get("container_image", "nginx:latest"),
            "container_port": deployment_params.get("container_port", "80"),
            "cpu": deployment_params.get("cpu", "256"),
            "memory": deployment_params.get("memory", "512"),
            "launch_type": deployment_params.get("launch_type", "FARGATE")
        })
    elif resource_type == "alb":
        config.update({
            "internal": deployment_params.get("internal", "false")
        })
    elif resource_type == "security_group":
        config.update({
            "sg_description": deployment_params.get("sg_description", "Managed by Terraform"),
            "vpc_id": deployment_params.get("vpc_id", "vpc-default"),
            "ingress_rules": deployment_params.get("ingress_rules", [{"from_port":80,"to_port":80,"protocol":"tcp","cidr_blocks":["0.0.0.0/0"],"description":"HTTP"}])
        })
        
    # Add config JSON to inputs
    inputs["config_json"] = json.dumps(config)
    
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
            "parameters": {**inputs, **deployment_params},
            "created_at": datetime.utcnow().isoformat()
        })
        
        return {
            "deployment_id": deployment_id,
            "status": "pending",
            "message": "Deployment triggered successfully"
        }
    else:
        raise Exception(f"Failed to trigger workflow: {response.status_code} - {response.text}")