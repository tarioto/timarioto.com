variable "aws_region" {
  description = "Region for regional resources (S3 bucket, etc.)."
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Apex domain for the site."
  type        = string
  default     = "timarioto.com"
}

variable "subject_alternative_names" {
  description = "Additional names on the certificate / CloudFront aliases (e.g. www)."
  type        = list(string)
  default     = ["www.timarioto.com"]
}
