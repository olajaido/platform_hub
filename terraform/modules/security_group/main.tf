# modules/security_group/main.tf
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

# Security Group
resource "aws_security_group" "this" {
  name        = var.name
  description = var.description
  vpc_id      = var.vpc_id
  
  tags = local.tags
}

# Egress rules
resource "aws_security_group_rule" "egress" {
  count = var.enable_default_egress ? 1 : 0
  
  security_group_id = aws_security_group.this.id
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
}

# Ingress rules from CIDR blocks
resource "aws_security_group_rule" "ingress_cidr" {
  count = length(var.ingress_rules)
  
  security_group_id = aws_security_group.this.id
  type              = "ingress"
  from_port         = var.ingress_rules[count.index].from_port
  to_port           = var.ingress_rules[count.index].to_port
  protocol          = var.ingress_rules[count.index].protocol
  cidr_blocks       = var.ingress_rules[count.index].cidr_blocks
  description       = lookup(var.ingress_rules[count.index], "description", "Rule ${count.index}")
}

# Ingress rules from security groups
resource "aws_security_group_rule" "ingress_sg" {
  count = length(var.ingress_with_source_security_group_id)
  
  security_group_id        = aws_security_group.this.id
  type                     = "ingress"
  from_port                = var.ingress_with_source_security_group_id[count.index].from_port
  to_port                  = var.ingress_with_source_security_group_id[count.index].to_port
  protocol                 = var.ingress_with_source_security_group_id[count.index].protocol
  source_security_group_id = var.ingress_with_source_security_group_id[count.index].source_security_group_id
  description              = lookup(var.ingress_with_source_security_group_id[count.index], "description", "Rule ${count.index} from SG")
} 