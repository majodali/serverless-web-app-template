# Deploying (local)

Deploy from your machine with your own AWS credentials. For hands-off deploys
from GitHub, see **[docs/CI_DEPLOY.md](./docs/CI_DEPLOY.md)** instead.

## 1. Prerequisites

- An **AWS account** and the **AWS CLI** configured (`aws sts get-caller-identity`).
- **Node.js 20+**.
- **(Optional) a custom domain in Route 53** in the same account. Skip it to
  deploy to the auto-generated CloudFront URL, then add the domain later.
- If using a custom domain, deploy in **`us-east-1`** (CloudFront needs its ACM
  cert there).

## 2. Install + configure

```bash
npm install
cp infra/.env.example infra/.env    # then edit infra/.env
```

| Variable         | What it is                                                    |
| ---------------- | ------------------------------------------------------------- |
| `APP_NAME`       | Short name; used for stack + resource naming (e.g. `mynotes`).|
| `ADMIN_USERNAME` | First admin login, seeded on deploy.                          |
| `ADMIN_PASSWORD` | A strong password for that admin.                             |
| `DOMAIN_NAME`    | Optional custom domain (blank = CloudFront URL).              |
| `INCLUDE_WWW`    | `true` to also serve `www.<domain>`.                          |

## 3. Bootstrap (first time per account/region)

```bash
cd infra
npx cdk bootstrap
cd ..
```

## 4. Deploy

```bash
npm run deploy    # builds the SPA, then cdk deploy
```

Outputs include your **SiteUrl** (custom domain or CloudFront URL), the **ApiUrl**,
and the data resources. On the first deploy with a custom domain, allow a few
minutes for the certificate + DNS to propagate.

## 5. First login

Open the SiteUrl and sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Use the
**Admin** panel to create more accounts. Open **Admin → Diagnostics** and run
the suite to confirm the deployment end-to-end.

## Updating

```bash
git pull && npm install && npm run deploy
```

CloudFront is invalidated automatically on each deploy.

## Teardown

```bash
cd infra && npx cdk destroy
```

Data resources (the DynamoDB tables and the JWT secret) are **retained** by
default so you don't lose data by accident — delete them by hand in the console
if you truly want them gone.

## Cost

At low usage this is typically within or near the AWS Free Tier — you pay per
request (Lambda, API Gateway), per stored item (DynamoDB on-demand), per GB (S3),
and CloudFront egress. Nothing runs while idle.
