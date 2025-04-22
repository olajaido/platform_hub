# modules/alb/variables.tf

variable "region" {
  description = "AWS region for the ALB"
  type        = string
}

variable "name" {
  description = "Name for the ALB and related resources"
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
  description = "VPC ID where the ALB should be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the ALB (should be public subnets)"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the ALB"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Allow from everywhere by default
}

variable "internal" {
  description = "Whether the ALB should be internal"
  type        = bool
  default     = false
}

variable "enable_deletion_protection" {
  description = "Whether to enable deletion protection for the ALB"
  type        = bool
  default     = false
}

variable "access_logs_bucket" {
  description = "S3 bucket name for access logs (if empty, access logs are disabled)"
  type        = string
  default     = ""
}

variable "ssl_certificate_arn" {
  description = "ARN of the SSL certificate to use for HTTPS listeners (if empty, only HTTP listener is created)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the ALB (e.g., app.example.com)"
  type        = string
  default     = ""
}

variable "route53_zone_name" {
  description = "Route 53 zone name (if different from the domain's parent zone)"
  type        = string
  default     = ""
}

variable "create_dns_record" {
  description = "Whether to create a DNS record for the ALB"
  type        = bool
  default     = false
} 