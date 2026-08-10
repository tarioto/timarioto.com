terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state for now. To move to remote state later, add an S3 backend
  # block here (bucket + DynamoDB lock table) and run `tofu init -migrate-state`.
}
