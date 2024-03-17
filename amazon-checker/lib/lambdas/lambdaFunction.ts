import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MyLambdaFunction extends Construct {
  public readonly function: lambdaNodejs.NodejsFunction;
  public readonly functionUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, graphqlUrl: string) {
    super(scope, id);

    this.function = new lambdaNodejs.NodejsFunction(this, 'Function', {
      entry: 'functions/call-api/src/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        APPSYNC_ENDPOINT: graphqlUrl,
      },
    });

    this.function.addToRolePolicy(new iam.PolicyStatement({
        actions: ['appsync:GraphQL'],
        resources: ['*'],
        //resources: [api.arn],
    }));

    this.functionUrl = new lambda.FunctionUrl(this, 'FunctionUrl', {
      function: this.function,
      authType: lambda.FunctionUrlAuthType.NONE,
    });
  }
}
