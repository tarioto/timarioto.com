provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "timarioto.com"
      ManagedBy = "OpenTofu"
    }
  }
}

# CloudFront requires its ACM certificate to live in us-east-1, regardless of
# where the rest of the infrastructure runs.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "timarioto.com"
      ManagedBy = "OpenTofu"
    }
  }
}
