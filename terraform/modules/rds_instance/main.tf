# modules/rds_instance/main.tf
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

# Security group for RDS
resource "aws_security_group" "rds" {
  count       = length(var.security_group_ids) == 0 ? 1 : 0
  name        = "${var.name}-rds-sg"
  description = "Security group for RDS instance ${var.name}"
  vpc_id      = var.vpc_id

  # Default MySQL/PostgreSQL port
  ingress {
    from_port   = var.engine == "mysql" ? 3306 : 5432
    to_port     = var.engine == "mysql" ? 3306 : 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # In production, this should be restricted
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

# Subnet group for RDS
resource "aws_db_subnet_group" "this" {
  name       = "${var.name}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = local.tags
}

# RDS Instance
resource "aws_db_instance" "this" {
  identifier           = var.name
  allocated_storage    = var.allocated_storage
  storage_type         = var.storage_type
  engine               = var.engine
  engine_version       = var.engine_version
  instance_class       = var.instance_class
  username             = var.username
  password             = var.password
  parameter_group_name = var.parameter_group_name
  skip_final_snapshot  = var.skip_final_snapshot
  publicly_accessible  = var.publicly_accessible
  multi_az             = var.multi_az
  db_subnet_group_name = aws_db_subnet_group.this.name
  vpc_security_group_ids = length(var.security_group_ids) > 0 ? var.security_group_ids : [aws_security_group.rds[0].id]
  
  tags = local.tags
}
