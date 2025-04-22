# modules/rds_instance/outputs.tf

output "db_instance_id" {
  description = "The ID of the RDS instance"
  value       = aws_db_instance.this.id
}

output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.this.address
}

output "db_instance_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = aws_db_instance.this.endpoint
}

output "db_instance_port" {
  description = "The port of the RDS instance"
  value       = aws_db_instance.this.port
}

output "db_instance_username" {
  description = "The master username of the RDS instance"
  value       = aws_db_instance.this.username
}

output "db_instance_password" {
  description = "The master password of the RDS instance (if created by Terraform)"
  value       = var.master_password != "" ? var.master_password : random_password.master_password[0].result
  sensitive   = true
}

output "db_security_group_id" {
  description = "The security group ID associated with the RDS instance"
  value       = aws_security_group.db.id
}

output "ssm_parameter_path" {
  description = "Path prefix for SSM parameters storing RDS instance details"
  value       = "/rds/${var.name}"
}

output "connection_string" {
  description = "Connection string for the database"
  value       = format(
    "%s://%s:%s@%s:%s",
    var.engine == "mysql" || var.engine == "aurora-mysql" ? "mysql" : "postgresql",
    aws_db_instance.this.username,
    var.master_password != "" ? var.master_password : random_password.master_password[0].result,
    aws_db_instance.this.address,
    aws_db_instance.this.port
  )
  sensitive   = true
} 