output "s3_bucket" {
  description = "Name of the S3 bucket to sync built files into (AWS_S3_BUCKET secret)."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (AWS_CLOUDFRONT_DISTRIBUTION_ID secret)."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain, for verifying before DNS cutover."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "certificate_arn" {
  description = "ARN of the issued ACM certificate."
  value       = aws_acm_certificate.site.arn
}

output "deploy_role_arn" {
  description = "ARN of the OIDC role the CI deploy workflow assumes (role-to-assume)."
  value       = aws_iam_role.github_actions_deploy.arn
}
