# modules/ec2_instance/outputs.tf
output "instance_id" {
  description = "ID of the created EC2 instance"
  value       = aws_instance.this.id
}

output "instance_private_ip" {
  description = "Private IP of the created EC2 instance"
  value       = aws_instance.this.private_ip
}

output "instance_public_ip" {
  description = "Public IP of the created EC2 instance"
  value       = aws_instance.this.public_ip
}

output "elastic_ip" {
  description = "Elastic IP attached to the instance (if enabled)"
  value       = var.assign_eip ? aws_eip.this[0].public_ip : null
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh ec2-user@${var.assign_eip ? aws_eip.this[0].public_ip : aws_instance.this.public_ip}"
}