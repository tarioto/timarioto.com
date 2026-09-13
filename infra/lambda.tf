# Scheduled poller that writes the latest Trakt watch activity to trakt.json
# in the site bucket. CloudFront already serves everything in that bucket
# (see cloudfront.tf), so no distribution/bucket-policy changes are needed —
# the frontend just fetches /trakt.json as a same-origin static file.

data "archive_file" "trakt_poller" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/trakt-poller"
  output_path = "${path.module}/.archives/trakt-poller.zip"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "trakt_poller_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# Least privilege: write only the one object this function produces, and log
# only to its own log group.
data "aws_iam_policy_document" "trakt_poller_permissions" {
  statement {
    sid       = "WriteTraktActivityObject"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.site.arn}/trakt.json"]
  }

  statement {
    sid = "WriteOwnLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/trakt-poller:*",
    ]
  }
}

resource "aws_iam_role" "trakt_poller" {
  name               = "trakt-poller-lambda"
  description        = "Execution role for the scheduled Trakt activity poller Lambda."
  assume_role_policy = data.aws_iam_policy_document.trakt_poller_assume.json
}

resource "aws_iam_role_policy" "trakt_poller" {
  name   = "trakt-poller"
  role   = aws_iam_role.trakt_poller.id
  policy = data.aws_iam_policy_document.trakt_poller_permissions.json
}

resource "aws_lambda_function" "trakt_poller" {
  function_name = "trakt-poller"
  description   = "Polls Trakt for the latest watched movie/episode and writes trakt.json to the site bucket."
  role          = aws_iam_role.trakt_poller.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  timeout       = 15

  filename         = data.archive_file.trakt_poller.output_path
  source_code_hash = data.archive_file.trakt_poller.output_base64sha256

  environment {
    variables = {
      TRAKT_CLIENT_ID = var.trakt_client_id
      TRAKT_USERNAME  = var.trakt_username
      SITE_BUCKET     = aws_s3_bucket.site.id
    }
  }
}

resource "aws_cloudwatch_event_rule" "trakt_poller_schedule" {
  name                = "trakt-poller-schedule"
  description         = "Triggers the Trakt activity poller Lambda."
  schedule_expression = "rate(30 minutes)"
}

resource "aws_cloudwatch_event_target" "trakt_poller" {
  rule = aws_cloudwatch_event_rule.trakt_poller_schedule.name
  arn  = aws_lambda_function.trakt_poller.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.trakt_poller.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.trakt_poller_schedule.arn
}
