# modules/s3_bucket/variables.tf
variable "region" {
  description = "AWS region"
  type        = string
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "infrastructure-platform"
}

variable "deployment_id" {
  description = "Unique identifier for this deployment"
  type        = string
}

variable "versioning_enabled" {
  description = "Whether to enable versioning for the bucket"
  type        = bool
  default     = false
}

variable "deployment_id" {
  description = "Unique identifier for this deployment"
  type        = string
}