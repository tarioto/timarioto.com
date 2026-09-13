# IAM user for the local "song/album of the month" script (see
# scripts/song-of-the-month/ — runs on a schedule on a personal Mac via
# launchd, reads Apple Music play counts, and uploads song.json/album.json
# directly to the site bucket, the same way the poller Lambdas do).
#
# Deliberately does NOT create an aws_iam_access_key resource here — that
# would put the secret access key in Terraform state. Instead, after
# `tofu apply`, mint the key once out-of-band and store it locally:
#
#   aws iam create-access-key --user-name song-of-the-month-publisher
#   aws configure set aws_access_key_id     <key>    --profile song-of-the-month
#   aws configure set aws_secret_access_key <secret> --profile song-of-the-month
#
# Rotate/revoke with `aws iam list-access-keys` / `delete-access-key`.

# Least-privilege user for the local Apple Music poller script; can only
# write song.json/album.json to the site bucket.
resource "aws_iam_user" "song_publisher" {
  name = "song-of-the-month-publisher"
}

data "aws_iam_policy_document" "song_publisher_permissions" {
  statement {
    sid     = "WriteSongAndAlbumObjects"
    actions = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.site.arn}/song.json",
      "${aws_s3_bucket.site.arn}/album.json",
    ]
  }
}

resource "aws_iam_user_policy" "song_publisher" {
  name   = "song-of-the-month-publisher"
  user   = aws_iam_user.song_publisher.name
  policy = data.aws_iam_policy_document.song_publisher_permissions.json
}
