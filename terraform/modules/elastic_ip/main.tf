# modules/elastic_ip/main.tf
provider "aws" {
  region = var.region
}

locals {
  tags = {
    Name        = var.name
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = var.project
    DeploymentID = var.deployment_id
  }
}

# Elastic IP
resource "aws_eip" "this" {
  domain = "vpc"
  tags   = local.tags
}

# EC2 Association (optional)
resource "aws_eip_association" "this" {
  count         = var.instance_id != "" ? 1 : 0
  allocation_id = aws_eip.this.id
  instance_id   = var.instance_id
}
