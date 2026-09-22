# OIDC role assumed by the CI deploy workflow (.github/workflows/main.yml) to
# publish the built site. No long-lived AWS keys — GitHub Actions federates in
# via the existing account-level OIDC provider (shared with github-actions-tofu).
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# Trust: only this repo, only the main branch, only the GitHub OIDC audience.
data "aws_iam_policy_document" "deploy_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:ref:refs/heads/main"]
    }
  }
}

# Least privilege: sync objects into the site bucket + invalidate this one
# distribution. Nothing else.
data "aws_iam_policy_document" "deploy_permissions" {
  statement {
    sid       = "ListSiteBucket"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.site.arn]
  }

  statement {
    sid       = "WriteSiteObjects"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
  }

  statement {
    sid       = "InvalidateDistribution"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.site.arn]
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "github-actions-deploy"
  description        = "OIDC role for the CI deploy workflow to sync the site to S3 and invalidate CloudFront."
  assume_role_policy = data.aws_iam_policy_document.deploy_assume.json
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name   = "deploy-site"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.deploy_permissions.json
}
