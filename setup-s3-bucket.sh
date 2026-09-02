#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  branditbro — one-shot S3 setup for résumé storage (careers module)
#
#  What this does:
#    1. Creates a private S3 bucket in ap-south-1 (same region as SES)
#    2. Blocks ALL public access on it (belt-and-suspenders; the app
#       also writes objects as private with ContentDisposition, never
#       public URLs)
#    3. Turns on default server-side encryption (AES256)
#    4. Finds the IAM user behind whatever AWS credentials you run this
#       with, and attaches a minimal inline policy granting ONLY
#       s3:PutObject + s3:GetObject on this one bucket
#
#  Requirements:
#    - AWS CLI installed (https://aws.amazon.com/cli/) and configured
#      with credentials that can create S3 buckets + attach IAM policies
#      (run `aws configure` first if you haven't, or run this in
#      AWS CloudShell in the console — no install needed there).
#    - These should be credentials for YOUR account/admin, not
#      necessarily the app's SES-only key in .env — that key may not
#      have IAM permissions. This script auto-detects whichever
#      identity is active and attaches the policy to that IAM user.
#
#  After this succeeds, the bucket name below is already what your
#  .env expects — no further edits needed on your side.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

BUCKET="branditbro-resumes-666e7a33"
REGION="ap-south-1"
PREFIX="resumes"

echo "→ Checking AWS CLI identity..."
CALLER=$(aws sts get-caller-identity)
IAM_ARN=$(echo "$CALLER" | grep -o '"Arn": *"[^"]*"' | sed 's/.*"Arn": *"\(.*\)"/\1/')
IAM_USER=$(basename "$IAM_ARN")
echo "  Running as: $IAM_ARN"

echo "→ Creating bucket: $BUCKET (region: $REGION)..."
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

echo "→ Blocking all public access..."
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "→ Enabling default encryption (AES256)..."
aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{ "ApplyServerSideEncryptionByDefault": { "SSEAlgorithm": "AES256" } }]
  }'

echo "→ Attaching minimal S3 policy to IAM user: $IAM_USER..."
cat > /tmp/branditbro-s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BranditbroResumeStorage",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::${BUCKET}/*"
    }
  ]
}
EOF

aws iam put-user-policy \
  --user-name "$IAM_USER" \
  --policy-name "branditbro-careers-s3" \
  --policy-document file:///tmp/branditbro-s3-policy.json

echo ""
echo "✅ Done. Bucket '$BUCKET' is live, private, encrypted, and $IAM_USER can read/write to it."
echo ""
echo "Add these to your .env / .env.local (already matches what setup expects):"
echo "  CAREERS_S3_BUCKET=$BUCKET"
echo "  CAREERS_S3_PREFIX=$PREFIX"
echo "  AWS_S3_REGION=$REGION"
