# modules/alb/outputs.tf

output "alb_id" {
  description = "ID of the ALB"
  value       = aws_lb.this.id
}

output "alb_arn" {
  description = "ARN of the ALB"
  value       = aws_lb.this.arn
}

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = aws_lb.this.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the ALB"
  value       = aws_lb.this.zone_id
}

output "security_group_id" {
  description = "ID of the security group attached to the ALB"
  value       = aws_security_group.alb.id
}

output "http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener (if created)"
  value       = var.ssl_certificate_arn != "" ? aws_lb_listener.https[0].arn : ""
}

output "target_group_arn" {
  description = "ARN of the default target group"
  value       = aws_lb_target_group.default.arn
}

output "dns_record" {
  description = "DNS record created for the ALB (if any)"
  value       = var.domain_name != "" && var.create_dns_record ? aws_route53_record.this[0].fqdn : ""
}

output "domain_name" {
  description = "Domain name associated with the ALB"
  value       = var.domain_name
}

output "hostname" {
  description = "Hostname to use for the ALB (custom domain if provided, otherwise ALB DNS name)"
  value       = var.domain_name != "" ? var.domain_name : aws_lb.this.dns_name
} 