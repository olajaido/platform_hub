# modules/ecs_service/outputs.tf

output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.this.id
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.this.name
}

output "service_id" {
  description = "ID of the ECS service"
  value       = aws_ecs_service.this.id
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.this.name
}

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.this.arn
}

output "task_definition_family" {
  description = "Family of the task definition"
  value       = aws_ecs_task_definition.this.family
}

output "security_group_id" {
  description = "ID of the created security group (if created)"
  value       = length(var.security_group_ids) > 0 ? var.security_group_ids[0] : try(aws_security_group.ecs[0].id, "")
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.this.name
}

output "container_name" {
  description = "Name of the container"
  value       = "${var.name}-container"
}

output "target_group_arn" {
  description = "ARN of the target group (if created)"
  value       = var.load_balancer_arn != "" ? aws_lb_target_group.this[0].arn : ""
}

output "execution_role_arn" {
  description = "ARN of the execution role"
  value       = var.execution_role_arn != "" ? var.execution_role_arn : try(aws_iam_role.ecs_execution_role[0].arn, "")
}

output "task_role_arn" {
  description = "ARN of the task role"
  value       = var.task_role_arn != "" ? var.task_role_arn : try(aws_iam_role.ecs_task_role[0].arn, "")
} 