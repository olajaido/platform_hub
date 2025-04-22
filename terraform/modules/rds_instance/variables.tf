# modules/rds_instance/variables.tf
variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "name" {
  description = "Name of the RDS instance"
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

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "storage_type" {
  description = "Storage type (gp2, io1, etc.)"
  type        = string
  default     = "gp2"
}

variable "engine" {
  description = "Database engine (mysql, postgres, etc.)"
  type        = string
  default     = "mysql"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
  default     = "8.0"
}

variable "instance_class" {
  description = "Instance class (db.t3.micro, etc.)"
  type        = string
  default     = "db.t3.micro"
}

variable "username" {
  description = "Database admin username"
  type        = string
  default     = "admin"
}

variable "password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}

variable "parameter_group_name" {
  description = "Parameter group name"
  type        = string
  default     = "default.mysql8.0"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying"
  type        = bool
  default     = true
}

variable "publicly_accessible" {
  description = "Make instance publicly accessible"
  type        = bool
  default     = false
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
  default     = []
}
