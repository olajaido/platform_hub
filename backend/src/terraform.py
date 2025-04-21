import os
import logging
import uuid
from typing import Dict, Any
from datetime import datetime
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def execute_terraform(resource_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute Terraform by triggering a GitHub workflow
    
    Args:
        resource_type: The type of resource (e.g., ec2_instance, s3_bucket)
        params: Parameters for the Terraform template
            - size: Size of the resource (small, medium, large)
            - region: AWS region
            - parameters: Additional parameters (name, environment, etc.)
        
    Returns:
        Dict containing the deployment details:
            - status: Current status of deployment (pending, completed, failed)
            - deployment_id: Unique identifier for the deployment
            - resource_type: Type of resource being deployed
            - message: Human-readable status message
    """
    try:
        logger.info(f"Initiating deployment for {resource_type}")
        logger.info(f"Parameters: {params}")
        
        # Extract parameters
        # The ResourceRequest in main.py sends these nested parameters
        name = params.get("parameters", {}).get("name", f"{resource_type}-{uuid.uuid4().hex[:8]}")
        environment = params.get("parameters", {}).get("environment", "dev")
        region = params.get("region", "eu-west-2")
        
        # Map size to instance_type for EC2
        if resource_type == "ec2_instance":
            size_mapping = {
                "small": "t2.micro",
                "medium": "t2.small",
                "large": "t2.medium"
            }
            instance_type = size_mapping.get(params.get("size", "small"), "t2.micro")
        else:
            instance_type = None
        
        # Prepare deployment parameters for GitHub workflow
        deployment_params = {}
        
        # Add resource-specific parameters
        if resource_type == "ec2_instance":
            deployment_params = {
                "instance_type": instance_type,
                "volume_size": "20",  # Default value
                "assign_eip": "true",
                "subnet_id": params.get("parameters", {}).get("subnet_id", "subnet-07759e500cfdfb6b2")
            }
        elif resource_type == "s3_bucket":
            deployment_params = {
                "bucket_name": name.lower() + "-" + uuid.uuid4().hex[:8],  # Ensure unique bucket name
                "versioning_enabled": params.get("parameters", {}).get("versioning_enabled", "false")
            }
        
        # Add other parameters from the request
        deployment_params.update(params.get("parameters", {}))
        
        # Trigger the GitHub workflow
        from src.github_api import trigger_infrastructure_deployment
        
        result = await trigger_infrastructure_deployment(
            resource_type=resource_type,
            name=name,
            environment=environment,
            region=region,
            deployment_params=deployment_params
        )
        
        return {
            "status": "pending",
            "deployment_id": result["deployment_id"],
            "resource_type": resource_type,
            "message": "Deployment initiated through GitHub Actions"
        }
            
    except Exception as e:
        logger.error(f"Error executing Terraform: {str(e)}")
        # Generate a unique ID even for failed deployments
        error_deployment_id = f"deploy-error-{uuid.uuid4().hex[:8]}"
        
        # Record the failed deployment
        try:
            from src.supabase import save_deployment
            
            save_deployment({
                "id": error_deployment_id,
                "resource_type": resource_type,
                "status": "error",
                "parameters": params,
                "created_at": datetime.utcnow().isoformat(),
                "error_message": str(e)
            })
        except Exception as db_error:
            logger.error(f"Error saving failed deployment: {str(db_error)}")
        
        return {
            "status": "error",
            "deployment_id": error_deployment_id,
            "resource_type": resource_type,
            "message": f"Deployment failed: {str(e)}"
        }