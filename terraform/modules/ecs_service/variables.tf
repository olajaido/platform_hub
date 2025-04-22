# modules/ecs_service/variables.tf

variable "region" {
  description = "AWS region for the ECS service"
  type        = string
}

variable "name" {
  description = "Name for the ECS service and related resources"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "platform-hub"
}

variable "deployment_id" {
  description = "Unique identifier for this deployment"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the ECS service should be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the ECS service"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "List of security group IDs for the ECS service"
  type        = list(string)
  default     = []
}

variable "launch_type" {
  description = "ECS launch type (FARGATE or EC2)"
  type        = string
  default     = "FARGATE"
}

variable "container_image" {
  description = "Docker image for the container (e.g., nginx:latest)"
  type        = string
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 80
}

variable "cpu" {
  description = "CPU units for the task (e.g., 256 for .25 vCPU)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory for the task in MB (e.g., 512)"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 1
}

variable "assign_public_ip" {
  description = "Whether to assign a public IP address to the ENI"
  type        = bool
  default     = false
}

variable "environment_variables" {
  description = "Environment variables for the container"
  type        = map(string)
  default     = {}
}

variable "execution_role_arn" {
  description = "ARN of the IAM role that the ECS task will use for execution (if empty, a new one will be created)"
  type        = string
  default     = ""
}

variable "task_role_arn" {
  description = "ARN of the IAM role that the ECS task will use to access AWS resources (if empty, a new one will be created)"
  type        = string
  default     = ""
}

variable "load_balancer_arn" {
  description = "ARN of the load balancer to attach to the ECS service (if empty, no load balancer will be used)"
  type        = string
  default     = ""
}

variable "health_check_path" {
  description = "Path for the health check"
  type        = string
  default     = "/"
}

variable "enable_autoscaling" {
  description = "Whether to enable auto scaling for the ECS service"
  type        = bool
  default     = false
}

variable "min_capacity" {
  description = "Minimum number of tasks (for auto scaling)"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks (for auto scaling)"
  type        = number
  default     = 5
} 