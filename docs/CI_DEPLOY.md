# Deploying via GitHub Actions (OIDC)

The **Deploy** workflow builds and deploys on every push to `main` (and via the
**Run workflow** button). Auth uses **GitHub OIDC** — the workflow assumes an IAM
role at run time, so **no AWS keys are stored in the repo**.

## One-time AWS setup

### 1. Add GitHub as an OIDC provider (once per account)

Skip if `token.actions.githubusercontent.com` already exists under
IAM → Identity providers.

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

### 2. Create the deploy role

`trust-policy.json` (replace `<ACCOUNT_ID>` and `<OWNER>/<REPO>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<OWNER>/<REPO>:*" }
    }
  }]
}
```

```bash
aws iam create-role --role-name <app>-deploy \
  --assume-role-policy-document file://trust-policy.json

# Bootstrap + deploy need broad provisioning rights. AdministratorAccess is the
# simplest for a personal account; scope down later (CloudFormation, S3, Lambda,
# DynamoDB, API Gateway, CloudFront, Route53, ACM, IAM, Secrets Manager, Logs).
aws iam attach-role-policy --role-name <app>-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

## One-time GitHub setup

**Settings → Secrets and variables → Actions**

Secrets:

| Secret                | Value                                    |
| --------------------- | ---------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN` | The role ARN from above                  |
| `ADMIN_USERNAME`      | First admin login                        |
| `ADMIN_PASSWORD`      | Strong password for that admin           |

Variables:

| Variable            | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| `APP_NAME`          | Short app name (e.g. `mynotes`)                             |
| `AWS_REGION`        | Region to deploy in (`us-east-1` if custom domain)          |
| `ENABLE_WEBSOCKET`  | `true` to provision the WebSocket module (default `false`)  |
| `HOSTING_MODE`      | `cloudfront` (default) or `existing-bucket`                 |
| `DOMAIN_NAME`       | (cloudfront) custom domain, or unset for the CloudFront URL |
| `INCLUDE_WWW`       | (cloudfront) `true` / `false`                               |
| `SITE_BUCKET_NAME`  | (existing-bucket) the existing site bucket                  |
| `SITE_PATH_PREFIX`  | (existing-bucket) sub-folder, e.g. `myapp`                  |
| `SITE_BASE_URL`     | (existing-bucket) public URL, for the deploy output         |

**(Optional)** create a `production` Environment (Settings → Environments) for
approval gates.

## Run it

- **Automatic:** push to `main`.
- **Manual:** Actions → **Deploy** → **Run workflow**.

The run typechecks, builds the SPA, bootstraps CDK (idempotent), deploys, and
prints the stack outputs in the run summary.

## Security notes

- Credentials are short-lived and minted per run — nothing to rotate or leak.
- The trust policy restricts assumption to `repo:<OWNER>/<REPO>:*`; tighten to a
  branch with `...:ref:refs/heads/main` if you like.
