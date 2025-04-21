terraform {
  backend "s3" {
    bucket  = "ecommerce-project2024-terraform-state"
    key     = "platform/terraform.tfstate"
    region  = "eu-west-2"
    encrypt = true
  }
}