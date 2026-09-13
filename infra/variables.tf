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
  default     = "tima925"
}

variable "tmdb_api_key" {
  description = "TMDB (The Movie Database) v3 API key, used by the poller Lambda to look up poster art."
  type        = string
  sensitive   = true
}

variable "weather_api_key" {
  description = "OpenWeatherMap API key, used by the weather poller Lambda."
  type        = string
  sensitive   = true
}

variable "weather_zip" {
  description = "Postal code (OpenWeatherMap zip,country format) the weather poller Lambda fetches conditions for."
  type        = string
  default     = "8057,CH"
}
