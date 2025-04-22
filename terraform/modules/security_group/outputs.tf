# modules/security_group/outputs.tf

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.this.id
}

output "security_group_arn" {
  description = "ARN of the security group"
  value       = aws_security_group.this.arn
}

output "security_group_name" {
  description = "Name of the security group"
  value       = aws_security_group.this.name
}

output "security_group_description" {
  description = "Description of the security group"
  value       = aws_security_group.this.description
}

output "security_group_ingress_rules" {
  description = "List of ingress rules"
  value       = concat(
    [for rule in aws_security_group_rule.ingress_cidr : {
      id          = rule.id
      type        = rule.type
      from_port   = rule.from_port
      to_port     = rule.to_port
      protocol    = rule.protocol
      cidr_blocks = rule.cidr_blocks
      description = rule.description
    }],
    [for rule in aws_security_group_rule.ingress_sg : {
      id                      = rule.id
      type                    = rule.type
      from_port               = rule.from_port
      to_port                 = rule.to_port
      protocol                = rule.protocol
      source_security_group_id = rule.source_security_group_id
      description             = rule.description
    }]
  )
} 