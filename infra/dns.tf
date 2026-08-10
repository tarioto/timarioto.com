# Assumes the hosted zone for the domain already exists in Route53.
data "aws_route53_zone" "this" {
  name         = var.domain_name
  private_zone = false
}

# Alias records pointing every site name at the CloudFront distribution.
# allow_overwrite lets these replace whatever apex/www records point at the old
# distribution today, repointing the domain to the new stack on apply.
locals {
  site_names = toset(concat([var.domain_name], var.subject_alternative_names))
}

resource "aws_route53_record" "a" {
  for_each = local.site_names

  zone_id         = data.aws_route53_zone.this.zone_id
  name            = each.value
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "aaaa" {
  for_each = local.site_names

  zone_id         = data.aws_route53_zone.this.zone_id
  name            = each.value
  type            = "AAAA"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
