import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync'; // 修正
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class MyAppsyncDynamodbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDBテーブルの作成
    const table = new dynamodb.Table(this, 'MyTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    // AppSync APIの作成
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'my-api',
      schema: appsync.SchemaFile.fromAsset('schema/schema.gql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
      xrayEnabled: true,
    });

    // DynamoDBをデータソースとしてAppSync APIに追加
    const dataSource = api.addDynamoDbDataSource('MyDataSource', table);

    // リゾルバーの追加 (例: Query.getTodo)
    dataSource.createResolver('QueryGetDemosResolver', {
      typeName: 'Query',
      fieldName: 'getTodo',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('id', 'id'),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });
  }
}
