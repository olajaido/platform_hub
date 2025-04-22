# modules/ecs_service/main.tf
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

# ECS Cluster (if not using existing)
resource "aws_ecs_cluster" "this" {
  count = var.cluster_id == "" ? 1 : 0
  name  = "${var.name}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = local.tags
}

# ECS Task Definition
resource "aws_ecs_task_definition" "this" {
  family                   = var.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn
  
  container_definitions = jsonencode([
    {
      name      = var.container_name
      image     = var.container_image
      essential = true
      
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      
      environment = var.environment_variables
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.name}"
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
  
  tags = local.tags
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "this" {
  name              = "/ecs/${var.name}"
  retention_in_days = var.log_retention_days
  
  tags = local.tags
}

# ECS Service
resource "aws_ecs_service" "this" {
  name            = var.name
  cluster         = var.cluster_id != "" ? var.cluster_id : aws_ecs_cluster.this[0].id
  task_definition = aws_ecs_task_definition.this.arn
  launch_type     = "FARGATE"
  
  desired_count                      = var.desired_count
  deployment_minimum_healthy_percent = var.deployment_minimum_healthy_percent
  deployment_maximum_percent         = var.deployment_maximum_percent
  
  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = var.assign_public_ip
  }
  
  # Load balancer configuration (if provided)
  dynamic "load_balancer" {
    for_each = var.target_group_arn != "" ? [1] : []
    content {
      target_group_arn = var.target_group_arn
      container_name   = var.container_name
      container_port   = var.container_port
    }
  }
  
  # Deployment controller
  deployment_controller {
    type = var.deployment_controller_type
  }
  
  tags = local.tags
}
