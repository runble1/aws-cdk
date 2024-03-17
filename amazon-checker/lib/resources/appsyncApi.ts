import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AppSyncApi {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, productTable: dynamodb.Table) {
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

    // Update Mutation Resolver for LowPrice
    dataSource.createResolver('MutationPutProduct', {
      typeName: 'Mutation',
      fieldName: 'putProduct',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "productId": $util.dynamodb.toDynamoDBJson($ctx.args.productId)
          },
          "attributeValues": {
            "title": $util.dynamodb.toDynamoDBJson($ctx.args.Title),
            "url": $util.dynamodb.toDynamoDBJson($ctx.args.URL),
            "category": $util.dynamodb.toDynamoDBJson($ctx.args.Category),
            "lowPrice": $util.dynamodb.toDynamoDBJson($ctx.args.LowPrice)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });
  }
}
