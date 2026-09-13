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

variable "github_repository" {
  description = "owner/repo allowed to assume the deploy role via OIDC."
  type        = string
  default     = "tarioto/timarioto.com"
}

variable "trakt_client_id" {
  description = "Trakt API application client ID, used as the trakt-api-key header by the poller Lambda."
  type        = string
  sensitive   = true
}

variable "trakt_username" {
  description = "Trakt username whose public watch history the poller Lambda reads."
  type        = string
  default     = "tarioto"
}
