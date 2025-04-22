# modules/ecs_service/outputs.tf
output "cluster_id" {
  description = "The ID of the ECS cluster"
  value       = var.cluster_id != "" ? var.cluster_id : aws_ecs_cluster.this[0].id
}

output "cluster_arn" {
  description = "The ARN of the ECS cluster"
  value       = var.cluster_id != "" ? var.cluster_id : aws_ecs_cluster.this[0].arn
}

output "service_id" {
  description = "The ID of the ECS service"
  value       = aws_ecs_service.this.id
}

output "service_name" {
  description = "The name of the ECS service"
  value       = aws_ecs_service.this.name
}

output "task_definition_arn" {
  description = "The ARN of the task definition"
  value       = aws_ecs_task_definition.this.arn
}

output "task_definition_family" {
  description = "The family of the task definition"
  value       = aws_ecs_task_definition.this.family
}
