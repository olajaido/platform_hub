# modules/s3_bucket/main.tf
provider "aws" {
  region = var.region
}

locals {
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = var.project
    DeploymentID = var.deployment_id
  }
}

# S3 Bucket
resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  
  tags = local.tags
}

# Bucket ACL
resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "this" {
  depends_on = [aws_s3_bucket_ownership_controls.this]
  
  bucket = aws_s3_bucket.this.id
  acl    = "private"
}

# Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Versioning
resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id
  
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Public access block
resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}