# modules/ecs_service/variables.tf
variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "name" {
  description = "Name of the ECS service"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "platform-hub"
}

variable "deployment_id" {
  description = "Unique deployment ID"
  type        = string
}

variable "cluster_id" {
  description = "ID of an existing ECS cluster (if not provided, a new one will be created)"
  type        = string
  default     = ""
}

variable "cpu" {
  description = "CPU units for the task (1 vCPU = 1024 CPU units)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory for the task (in MiB)"
  type        = number
  default     = 512
}

variable "execution_role_arn" {
  description = "ARN of the task execution role"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the task role"
  type        = string
  default     = ""
}

variable "container_name" {
  description = "Name of the container"
  type        = string
  default     = "app"
}

variable "container_image" {
  description = "Docker image for the container"
  type        = string
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 80
}

variable "environment_variables" {
  description = "Environment variables for the container"
  type        = list(object({
    name  = string
    value = string
  }))
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 1
}

variable "deployment_minimum_healthy_percent" {
  description = "Minimum healthy percent during deployment"
  type        = number
  default     = 100
}

variable "deployment_maximum_percent" {
  description = "Maximum percent during deployment"
  type        = number
  default     = 200
}

variable "subnet_ids" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

variable "assign_public_ip" {
  description = "Assign public IP to the task"
  type        = bool
  default     = false
}

variable "target_group_arn" {
  description = "ARN of the target group (if using a load balancer)"
  type        = string
  default     = ""
}

variable "deployment_controller_type" {
  description = "Type of deployment controller"
  type        = string
  default     = "ECS"
}
