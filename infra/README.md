# Infrastructure (OpenTofu)

Infrastructure-as-code for the static site `timarioto.com`: a private S3 bucket
served through CloudFront (Origin Access Control) with a DNS-validated ACM
certificate and Route53 alias records.

## Resources

| File            | Resources |
| --------------- | --------- |
| `s3.tf`         | Private S3 bucket + public-access block + CloudFront-only bucket policy |
| `cloudfront.tf` | Origin Access Control + CloudFront distribution |
| `acm.tf`        | ACM cert (us-east-1) + Route53 DNS validation (auto-renews) |
| `dns.tf`        | Route53 A/AAAA alias records for apex + www |
| `variables.tf`  | `aws_region`, `domain_name`, `subject_alternative_names` |
| `outputs.tf`    | Bucket name, distribution ID, CloudFront domain, cert ARN |

State is stored remotely in S3 (`s3://timarioto-tofu-state-322859817636`, key
`timarioto.com/terraform.tfstate`) with native S3 locking (`use_lockfile`, no
DynamoDB). The bucket is versioned and encrypted. Backend config is in
`versions.tf`; run `tofu init` to use it.

## Apply

Requires AWS credentials with S3, CloudFront, ACM, and Route53 permissions, and
an existing Route53 **hosted zone** for the domain.

```bash
cd infra
tofu init      # first time only
tofu plan
tofu apply
```

`apply` takes ~5–10 min (ACM validation + CloudFront deploy). Downtime during the
switch is acceptable — the Route53 records overwrite the old ones, repointing the
domain to the new distribution.

## Deploy site content to the new bucket

After apply, capture the outputs and push content:

```bash
tofu output          # note s3_bucket + cloudfront_distribution_id
cd .. && bun run build
aws s3 sync ./dist/ s3://<s3_bucket>/ --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

Then update the two GitHub Actions secrets so CI targets the new stack:

```bash
gh secret set AWS_S3_BUCKET --repo tarioto/timarioto.com --body "<s3_bucket>"
gh secret set AWS_CLOUDFRONT_DISTRIBUTION_ID --repo tarioto/timarioto.com --body "<id>"
```

## Remove the OLD (pre-IaC) resources

The old bucket, distribution, and expired cert are **not** in OpenTofu state, so
`tofu destroy` won't touch them. Remove them manually once the new site is
verified (find their IDs from the old GitHub secrets / AWS console):

```bash
# 1. Disable, then delete the old CloudFront distribution (must be disabled first)
# 2. Empty + delete the old S3 bucket:  aws s3 rb s3://<old-bucket> --force
# 3. Delete the old (expired) ACM cert once nothing references it (us-east-1):
#    aws acm delete-certificate --certificate-arn <arn> --region us-east-1
```
