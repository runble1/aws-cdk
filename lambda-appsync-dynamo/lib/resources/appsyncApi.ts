import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AppSyncApi {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, productTable: dynamodb.Table) {
    const loggingRole = new iam.Role(scope, 'AppSyncLoggingRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs'),
      ],
    });

    this.api = new appsync.GraphqlApi(scope, 'Api', {
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

    const dataSource = this.api.addDynamoDbDataSource('MyDataSource', productTable);

    dataSource.createResolver('QueryGetProduct', {
      typeName: 'Query',
      fieldName: 'getProduct',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('productId', 'productId'),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });
  }
}
