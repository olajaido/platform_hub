import os
import logging
import uuid
from typing import Dict, Any, List
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

async def execute_terraform_stack(resources: List[Any]) -> Dict[str, Any]:
    """
    Execute Terraform for a stack of resources with dependencies
    
    Args:
        resources: List of ResourceDefinition objects with dependencies
            Each resource has:
            - resource_type: Type of resource (ec2_instance, s3_bucket, etc.)
            - name: Name for the resource
            - environment: Environment (dev, staging, prod)
            - region: AWS region
            - parameters: Configuration parameters
            - dependencies: List of resource IDs this resource depends on
        
    Returns:
        Dict containing the deployment details:
            - status: Current status of deployment (pending)
            - deployment_id: Unique identifier for the stack deployment
            - message: Human-readable status message
    """
    try:
        logger.info(f"Initiating stack deployment with {len(resources)} resources")
        
        # Generate a unique stack ID
        stack_id = f"stack-{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:8]}"
        
        # Define state file location for tracking
        state_file_location = {
            "bucket": "platform-hub-terraform-state",
            "key": f"stacks/{stack_id}/terraform.tfstate",
            "region": resources[0].region if resources else "eu-west-2"
        }
        
        # Create a dependency graph of resources
        resource_map = {resource.id: resource for resource in resources}
        
        # Sort resources based on dependencies (topological sort)
        sorted_resources = sort_resources_by_dependencies(resources)
        
        logger.info(f"Resources sorted by dependencies: {[r.name for r in sorted_resources]}")
        
        # Prepare the stack configuration for GitHub workflow
        stack_config = {
            "stack_id": stack_id,
            "resources": []
        }
        
        # Process each resource
        for resource in sorted_resources:
            # Prepare resource configuration
            resource_config = {
                "id": resource.id,
                "resource_type": resource.resource_type,
                "name": resource.name,
                "environment": resource.environment,
                "region": resource.region,
                "parameters": resource.parameters,
                "dependencies": resource.dependencies
            }
            
            # Add resource-specific configurations
            if resource.resource_type == "ec2_instance":
                # Map size to instance type if needed
                if "size" in resource.parameters:
                    size_mapping = {
                        "small": "t2.micro",
                        "medium": "t2.small",
                        "large": "t2.medium"
                    }
                    resource_config["parameters"]["instance_type"] = size_mapping.get(
                        resource.parameters["size"], "t2.micro"
                    )
            
            # Add to stack configuration
            stack_config["resources"].append(resource_config)
        
        # Trigger the GitHub workflow for stack deployment
        from src.github_api import trigger_stack_deployment
        
        # This will be implemented in github_api.py
        result = await trigger_stack_deployment(stack_config)
        
        # Save stack deployment record
        from src.supabase import save_stack_deployment
        
        await save_stack_deployment({
            "id": stack_id,
            "resources": [r.dict() for r in resources],
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "state_file": state_file_location
        })
        
        return {
            "status": "pending",
            "deployment_id": stack_id,
            "message": f"Stack deployment initiated with {len(resources)} resources"
        }
            
    except Exception as e:
        logger.error(f"Error executing stack deployment: {str(e)}")
        # Generate a unique ID even for failed deployments
        error_stack_id = f"stack-error-{uuid.uuid4().hex[:8]}"
        
        # Record the failed deployment
        try:
            from src.supabase import save_stack_deployment
            
            await save_stack_deployment({
                "id": error_stack_id,
                "resources": [r.dict() for r in resources],
                "status": "error",
                "created_at": datetime.utcnow().isoformat(),
                "error_message": str(e)
            })
        except Exception as db_error:
            logger.error(f"Error saving failed stack deployment: {str(db_error)}")
        
        return {
            "status": "error",
            "deployment_id": error_stack_id,
            "message": f"Stack deployment failed: {str(e)}"
        }

def sort_resources_by_dependencies(resources: List[Any]) -> List[Any]:
    """
    Sort resources based on their dependencies using topological sort
    
    Args:
        resources: List of ResourceDefinition objects
        
    Returns:
        Sorted list of resources where dependencies come before dependents
    """
    # Create a map of resource ID to resource
    resource_map = {resource.id: resource for resource in resources}
    
    # Create a graph representation
    graph = {resource.id: set(resource.dependencies) for resource in resources}
    
    # Perform topological sort
    visited = set()
    temp_mark = set()
    ordered = []
    
    def visit(node):
        if node in temp_mark:
            # Cyclic dependency detected
            raise ValueError(f"Cyclic dependency detected involving resource {node}")
        
        if node not in visited:
            temp_mark.add(node)
            
            # Visit dependencies first
            for dependency in graph[node]:
                visit(dependency)
            
            temp_mark.remove(node)
            visited.add(node)
            ordered.append(resource_map[node])
    
    # Visit all nodes
    for resource in resources:
        if resource.id not in visited:
            visit(resource.id)
    
    # Reverse to get correct order (dependencies first)
    return list(reversed(ordered))