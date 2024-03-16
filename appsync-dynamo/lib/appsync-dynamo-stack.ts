import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync'; // 修正
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class MyAppsyncDynamodbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDBテーブルの作成
    const productTable = new dynamodb.Table(this, 'ProductTable', {
      tableName: 'Product', // 任意でテーブル名を指定
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時にテーブルも削除（開発環境でのみ推奨）
    });

    // AppSyncがログを出力するためのIAMロールを作成
    const loggingRole = new iam.Role(this, 'AppSyncLoggingRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs'),
      ],
    });
    
    // AppSync APIの作成
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'my-api',
      schema: appsync.SchemaFile.fromAsset('schema/schema.gql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
      },
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    // DynamoDBをデータソースとして追加
    const dataSource = api.addDynamoDbDataSource('MyDataSource', productTable);

    // リゾルバーの追加 (例: Query.getTodo)
    dataSource.createResolver('QueryGetDemosResolver', {
      typeName: 'Query',
      fieldName: 'getProduct',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('productId', 'productId'),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    const myLambdaFunction = new lambdaNodejs.NodejsFunction(this, 'MyLambdaFunction', {
      entry: 'functions/call-appsync/src/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        APPSYNC_ENDPOINT: api.graphqlUrl
      },
    });

    // Lambda関数に AppSync API を呼び出す権限を付与
    myLambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['appsync:GraphQL'],
      resources: ['*'],
      //resources: [api.arn],
    }));

    const lambdaFunctionUrl = new lambda.FunctionUrl(this, 'MyLambdaFunctionUrl', {
      function: myLambdaFunction,
      authType: lambda.FunctionUrlAuthType.NONE, // 認証タイプ。必要に応じて変更してください。
    });

    new cdk.CfnOutput(this, 'LambdaFunctionUrl', {
      value: lambdaFunctionUrl.url,
      description: 'The URL endpoint of the Lambda function',
    });
  }
}
