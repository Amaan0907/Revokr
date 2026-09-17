# Applies against the SANDBOX AWS account, which plays double duty as both
# the remediation target AND the account the ECS worker task runs in
# (App Runner was pulled by AWS during the event, so the worker moved to
# ECS Fargate — same-account model: the task assumes this role directly
# via the ecs-tasks.amazonaws.com service principal, no cross-account STS).

variable "sandbox_account_id" {
  description = "AWS account ID of the sandbox account (remediation target + ECS worker host)"
  type        = string
}

variable "target_user_path" {
  description = "IAM path that scopes which users Revokr is allowed to touch"
  type        = string
  default     = "/revokr-targets/"
}

# --- Demo target users live under this path ---
resource "aws_iam_user" "demo_leaked_user" {
  name = "demo-leaked-user"
  path = var.target_user_path
}

# --- Identity policy: the actual day-to-day permissions ---
resource "aws_iam_policy" "revokr_access_key_management" {
  name        = "revokr-manage-access-keys-under-target-path"
  description = "Allows managing access keys only for IAM users under ${var.target_user_path}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ManageAccessKeysUnderTargetPath"
        Effect = "Allow"
        Action = [
          "iam:ListAccessKeys",
          "iam:CreateAccessKey",
          "iam:UpdateAccessKey",
          "iam:DeleteAccessKey",
          "iam:GetUser",
          "iam:GetAccessKeyLastUsed",
        ]
        Resource = "arn:aws:iam::${var.sandbox_account_id}:user${var.target_user_path}*"
      }
    ]
  })
}

# --- Permissions boundary: the ceiling, never exceeded regardless of identity policy ---
resource "aws_iam_policy" "revokr_remediation_boundary" {
  name        = "revokr-remediation-permissions-boundary"
  description = "Caps the remediation role to access-key actions under ${var.target_user_path}, forever"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowOnlyAccessKeyActionsUnderTargetPath"
        Effect = "Allow"
        Action = [
          "iam:ListAccessKeys",
          "iam:CreateAccessKey",
          "iam:UpdateAccessKey",
          "iam:DeleteAccessKey",
          "iam:GetUser",
          "iam:GetAccessKeyLastUsed",
        ]
        Resource = "arn:aws:iam::${var.sandbox_account_id}:user${var.target_user_path}*"
      },
      {
        Sid    = "DenyBoundaryTamperingAndEscalation"
        Effect = "Deny"
        Action = [
          "iam:DeleteRolePermissionsBoundary",
          "iam:PutRolePermissionsBoundary",
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:AttachUserPolicy",
          "iam:AttachRolePolicy",
          "iam:PutUserPolicy",
          "iam:PutRolePolicy",
        ]
        Resource = "*"
      }
    ]
  })
}

# --- The role itself, with the boundary attached ---
resource "aws_iam_role" "revokr_remediation" {
  name = "revokr-remediation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ecs-tasks.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  permissions_boundary = aws_iam_policy.revokr_remediation_boundary.arn
}

resource "aws_iam_role_policy_attachment" "revokr_remediation_attach" {
  role       = aws_iam_role.revokr_remediation.name
  policy_arn = aws_iam_policy.revokr_access_key_management.arn
}

output "revokr_remediation_role_arn" {
  value = aws_iam_role.revokr_remediation.arn
}

output "revokr_remediation_boundary_arn" {
  value = aws_iam_policy.revokr_remediation_boundary.arn
}

output "demo_leaked_user_arn" {
  value = aws_iam_user.demo_leaked_user.arn
}
