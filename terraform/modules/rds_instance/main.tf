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

# Create subnet group if subnets are provided
resource "aws_db_subnet_group" "this" {
  count      = length(var.subnet_ids) > 0 ? 1 : 0
  name       = "${var.name}-subnet-group"
  subnet_ids = var.subnet_ids
  
  tags = local.tags
}

# Create security group for database
resource "aws_security_group" "db" {
  name        = "${var.name}-sg"
  description = "Security group for ${var.name} database"
  vpc_id      = var.vpc_id

  # Allow inbound traffic on the database port
  ingress {
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
    security_groups = var.allowed_security_group_ids
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

# Create random password if not provided
resource "random_password" "master_password" {
  count   = var.master_password == "" ? 1 : 0
  length  = 16
  special = false
}

# RDS Instance
resource "aws_db_instance" "this" {
  identifier           = var.name
  engine               = var.engine
  engine_version       = var.engine_version
  instance_class       = var.instance_class
  username             = var.master_username
  password             = var.master_password != "" ? var.master_password : random_password.master_password[0].result
  allocated_storage    = var.allocated_storage
  storage_type         = var.storage_type
  storage_encrypted    = true
  multi_az             = var.multi_az
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name = length(var.subnet_ids) > 0 ? aws_db_subnet_group.this[0].name : null
  publicly_accessible  = var.publicly_accessible
  skip_final_snapshot  = true
  
  # Aurora specific parameters are set conditionally
  dynamic "cluster_identifier" {
    for_each = var.is_aurora ? [1] : []
    content {
      cluster_identifier = "${var.name}-cluster"
    }
  }
  
  tags = local.tags
}

# Store database credentials in SSM Parameter Store (secure)
resource "aws_ssm_parameter" "db_host" {
  name        = "/rds/${var.name}/host"
  description = "RDS endpoint for ${var.name}"
  type        = "String"
  value       = aws_db_instance.this.address
  tags        = local.tags
}

resource "aws_ssm_parameter" "db_username" {
  name        = "/rds/${var.name}/username"
  description = "RDS master username for ${var.name}"
  type        = "String"
  value       = aws_db_instance.this.username
  tags        = local.tags
}

resource "aws_ssm_parameter" "db_password" {
  name        = "/rds/${var.name}/password"
  description = "RDS master password for ${var.name}"
  type        = "SecureString"
  value       = var.master_password != "" ? var.master_password : random_password.master_password[0].result
  tags        = local.tags
} 