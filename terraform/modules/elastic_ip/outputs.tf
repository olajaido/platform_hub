# modules/elastic_ip/outputs.tf
output "id" {
  description = "The ID of the elastic IP"
  value       = aws_eip.this.id
}

output "public_ip" {
  description = "The public IP address"
  value       = aws_eip.this.public_ip
}

output "public_dns" {
  description = "The public DNS name"
  value       = aws_eip.this.public_dns
}

output "association_id" {
  description = "The association ID (if associated with an instance)"
  value       = var.instance_id != "" ? aws_eip_association.this[0].id : null
}
