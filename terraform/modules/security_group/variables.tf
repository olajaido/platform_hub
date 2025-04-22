# modules/security_group/variables.tf

variable "region" {
  description = "AWS region for the security group"
  type        = string
}

variable "name" {
  description = "Name for the security group"
  type        = string
}

variable "description" {
  description = "Description for the security group"
  type        = string
  default     = "Managed by Terraform"
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
  description = "VPC ID where the security group should be created"
  type        = string
}

variable "enable_default_egress" {
  description = "Whether to create a default egress rule allowing all outbound traffic"
  type        = bool
  default     = true
}

variable "ingress_rules" {
  description = "List of ingress rules to create with CIDR blocks"
  type        = list(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    description = optional(string)
  }))
  default     = []
}

variable "ingress_with_source_security_group_id" {
  description = "List of ingress rules to create with source security group ID"
  type        = list(object({
    from_port                = number
    to_port                  = number
    protocol                 = string
    source_security_group_id = string
    description              = optional(string)
  }))
  default     = []
} 