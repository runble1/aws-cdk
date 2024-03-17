import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDbTables } from './resources/dynamodbTables';
import { AppSyncApi } from './resources/appsyncApi';
import { MyLambdaFunction } from './lambdas/lambdaFunction';

export class MyAppsyncDynamodbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoDbTables = new DynamoDbTables(this);
    const appSyncApi = new AppSyncApi(this, dynamoDbTables.productTable);
    const myLambdaFunction = new MyLambdaFunction(this, 'MyLambdaFunction', appSyncApi.api.graphqlUrl);

    // Lambda関数のURLを出力
    new cdk.CfnOutput(this, 'LambdaFunctionUrl', {
      value: myLambdaFunction.functionUrl.url,
      description: 'The ARN of the Lambda function',
    });
  }
}
