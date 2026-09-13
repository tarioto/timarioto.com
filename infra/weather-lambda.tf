# Scheduled poller that writes the current conditions/forecast to
# weather.json in the site bucket. CloudFront already serves everything in
# that bucket (see cloudfront.tf), so no distribution/bucket-policy changes
# are needed — the frontend just fetches /weather.json as a same-origin
# static file.

data "archive_file" "weather_poller" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/weather-poller"
  output_path = "${path.module}/.archives/weather-poller.zip"
}

data "aws_iam_policy_document" "weather_poller_assume" {
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
data "aws_iam_policy_document" "weather_poller_permissions" {
  statement {
    sid       = "WriteWeatherObject"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.site.arn}/weather.json"]
  }

  statement {
    sid = "WriteOwnLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/weather-poller:*",
    ]
  }
}

resource "aws_iam_role" "weather_poller" {
  name               = "weather-poller-lambda"
  description        = "Execution role for the scheduled weather poller Lambda."
  assume_role_policy = data.aws_iam_policy_document.weather_poller_assume.json
}

resource "aws_iam_role_policy" "weather_poller" {
  name   = "weather-poller"
  role   = aws_iam_role.weather_poller.id
  policy = data.aws_iam_policy_document.weather_poller_permissions.json
}

resource "aws_lambda_function" "weather_poller" {
  function_name = "weather-poller"
  description   = "Polls OpenWeatherMap for current conditions/forecast and writes weather.json to the site bucket."
  role          = aws_iam_role.weather_poller.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  timeout       = 15

  filename         = data.archive_file.weather_poller.output_path
  source_code_hash = data.archive_file.weather_poller.output_base64sha256

  environment {
    variables = {
      WEATHER_API_KEY = var.weather_api_key
      WEATHER_ZIP     = var.weather_zip
      SITE_BUCKET     = aws_s3_bucket.site.id
    }
  }
}

resource "aws_cloudwatch_event_rule" "weather_poller_schedule" {
  name                = "weather-poller-schedule"
  description         = "Triggers the weather poller Lambda."
  schedule_expression = "rate(1 hour)"
}

resource "aws_cloudwatch_event_target" "weather_poller" {
  rule = aws_cloudwatch_event_rule.weather_poller_schedule.name
  arn  = aws_lambda_function.weather_poller.arn
}

resource "aws_lambda_permission" "allow_eventbridge_weather" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.weather_poller.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weather_poller_schedule.arn
}
