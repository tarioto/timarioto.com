terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state in S3 with native S3 locking (use_lockfile, no DynamoDB).
  backend "s3" {
    bucket       = "timarioto-tofu-state-322859817636"
    key          = "timarioto.com/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
