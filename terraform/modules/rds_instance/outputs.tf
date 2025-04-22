# modules/rds_instance/outputs.tf
output "id" {
  description = "The RDS instance ID"
  value       = aws_db_instance.this.id
}

output "arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.this.arn
}

output "endpoint" {
  description = "The connection endpoint"
  value       = aws_db_instance.this.endpoint
}

output "engine" {
  description = "The database engine"
  value       = aws_db_instance.this.engine
}

output "status" {
  description = "The RDS instance status"
  value       = aws_db_instance.this.status
}

output "security_group_id" {
  description = "The security group ID for the RDS instance"
  value       = length(var.security_group_ids) > 0 ? var.security_group_ids[0] : aws_security_group.rds[0].id
}
