import * as path from "node:path";
import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  CfnOutput,
  CustomResource,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwInteg from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as customResources from "aws-cdk-lib/custom-resources";
import * as logs from "aws-cdk-lib/aws-logs";
import type { AppConfig } from "./config";

const BACKEND = path.join(__dirname, "..", "..", "backend", "src");
const FRONTEND_DIST = path.join(__dirname, "..", "..", "frontend", "dist");

export interface AppStackProps extends StackProps {
  config: AppConfig;
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);
    const { config } = props;

    // ---- DynamoDB ----
    const users = new dynamodb.Table(this, "Users", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    users.addGlobalSecondaryIndex({
      indexName: "UsernameIndex",
      partitionKey: { name: "usernameLower", type: dynamodb.AttributeType.STRING },
    });

    const items = new dynamodb.Table(this, "Items", {
      partitionKey: { name: "ownerId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "itemId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // ---- JWT signing secret ----
    const jwtSecret = new secretsmanager.Secret(this, "JwtSecret", {
      description: `${config.appName} JWT signing secret`,
      generateSecretString: { passwordLength: 48, excludePunctuation: true },
    });

    // ---- Lambda factory (CommonJS output — see README) ----
    const commonEnv: Record<string, string> = {
      USERS_TABLE: users.tableName,
      ITEMS_TABLE: items.tableName,
      JWT_SECRET: jwtSecret.secretValue.unsafeUnwrap(),
      NODE_OPTIONS: "--enable-source-maps",
    };

    const makeFn = (id: string, entry: string): lambdaNode.NodejsFunction => {
      const fn = new lambdaNode.NodejsFunction(this, id, {
        entry: path.join(BACKEND, entry),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 256,
        timeout: Duration.seconds(15),
        environment: commonEnv,
        logRetention: logs.RetentionDays.TWO_WEEKS,
        bundling: {
          format: lambdaNode.OutputFormat.CJS,
          target: "node20",
          minify: true,
          sourceMap: true,
        },
      });
      for (const t of [users, items]) t.grantReadWriteData(fn);
      return fn;
    };

    // ---- HTTP API ----
    const httpApi = new apigw.HttpApi(this, "HttpApi", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: [
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.DELETE,
          apigw.CorsHttpMethod.OPTIONS,
        ],
      },
    });

    const route = (
      key: string,
      method: apigw.HttpMethod,
      pathPart: string,
      entry: string
    ) => {
      httpApi.addRoutes({
        path: pathPart,
        methods: [method],
        integration: new apigwInteg.HttpLambdaIntegration(key, makeFn(key + "Fn", entry)),
      });
    };

    route("Health", apigw.HttpMethod.GET, "/health", "http/health.ts");
    route("Login", apigw.HttpMethod.POST, "/login", "http/login.ts");
    route("Me", apigw.HttpMethod.GET, "/me", "http/me.ts");
    route("ChangePassword", apigw.HttpMethod.POST, "/me/password", "http/changePassword.ts");
    route("Users", apigw.HttpMethod.GET, "/users", "http/listUsers.ts");
    route("AdminUsers", apigw.HttpMethod.POST, "/admin/users", "http/adminCreateUser.ts");
    route(
      "AdminResetPassword",
      apigw.HttpMethod.POST,
      "/admin/users/{userId}/password",
      "http/adminResetPassword.ts"
    );
    route("ListItems", apigw.HttpMethod.GET, "/items", "http/listItems.ts");
    route("CreateItem", apigw.HttpMethod.POST, "/items", "http/createItem.ts");
    route("DeleteItem", apigw.HttpMethod.DELETE, "/items/{itemId}", "http/deleteItem.ts");

    // ---- Frontend hosting: S3 + CloudFront (+ optional custom domain) ----
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    let certificate: acm.ICertificate | undefined;
    let domainNames: string[] | undefined;
    let hostedZone: route53.IHostedZone | undefined;

    if (config.domainName) {
      hostedZone = route53.HostedZone.fromLookup(this, "Zone", {
        domainName: config.domainName,
      });
      domainNames = [config.domainName];
      if (config.includeWww) domainNames.push(`www.${config.domainName}`);
      certificate = new acm.Certificate(this, "SiteCert", {
        domainName: config.domainName,
        subjectAlternativeNames: config.includeWww ? [`www.${config.domainName}`] : undefined,
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });
    }

    const distribution = new cloudfront.Distribution(this, "SiteDistribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: "/index.html" },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: "/index.html" },
      ],
      domainNames,
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    if (hostedZone && config.domainName) {
      new route53.ARecord(this, "AliasRecord", {
        zone: hostedZone,
        recordName: config.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });
      if (config.includeWww) {
        new route53.ARecord(this, "WwwAliasRecord", {
          zone: hostedZone,
          recordName: `www.${config.domainName}`,
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
        });
      }
    }

    // Runtime config the SPA fetches on load (never hardcode URLs in the build).
    const apiUrl = httpApi.apiEndpoint;
    new s3deploy.BucketDeployment(this, "DeploySite", {
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
      sources: [
        s3deploy.Source.asset(FRONTEND_DIST),
        s3deploy.Source.jsonData("config.json", { apiUrl, appName: config.appName }),
      ],
    });

    // ---- Seed the first admin (custom resource) ----
    const seedFn = makeFn("SeedAdminFn", "ops/seedAdmin.ts");
    seedFn.addEnvironment("ADMIN_USERNAME", config.adminUsername);
    seedFn.addEnvironment("ADMIN_PASSWORD", config.adminPassword);
    const seedProvider = new customResources.Provider(this, "SeedProvider", {
      onEventHandler: seedFn,
    });
    new CustomResource(this, "SeedAdmin", {
      serviceToken: seedProvider.serviceToken,
      properties: { username: config.adminUsername },
    });

    // ---- Outputs ----
    new CfnOutput(this, "SiteUrl", {
      value: config.domainName
        ? `https://${config.domainName}`
        : `https://${distribution.distributionDomainName}`,
      description: "Open this to use the app",
    });
    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });
    new CfnOutput(this, "ApiUrl", { value: apiUrl });
  }
}
