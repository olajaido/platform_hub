# modules/elastic_ip/variables.tf
variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "name" {
  description = "Name of the elastic IP"
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

variable "instance_id" {
  description = "ID of the EC2 instance to associate with (optional)"
  type        = string
  default     = ""
}
