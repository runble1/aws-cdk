import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AppSyncApi {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, productTable: dynamodb.Table, historyTable: dynamodb.Table) {
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
        fieldLogLevel: appsync.FieldLogLevel.ERROR,
      },
    });

    const dataSource = this.api.addDynamoDbDataSource('ProductDataSource', productTable);

    dataSource.createResolver('QueryGetProduct', {
      typeName: 'Query',
      fieldName: 'getProduct',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('productId', 'productId'),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

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
            "title": $util.dynamodb.toDynamoDBJson($ctx.args.title),
            "url": $util.dynamodb.toDynamoDBJson($ctx.args.url),
            "category": $util.dynamodb.toDynamoDBJson($ctx.args.caategory),
            "lowPrice": $util.dynamodb.toDynamoDBJson($ctx.args.lowPrice)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    const historyDataSource = this.api.addDynamoDbDataSource('HistoryDataSource', historyTable);

    historyDataSource.createResolver('QueryGetHistory',{
      typeName: 'Query',
      fieldName: 'getHistory',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Query",
          "index": "ProductIdIndex",
          "query": {
            "expression": "productId = :productId and checkTimestamp between :from and :to",
            "expressionValues": {
              ":productId": $util.dynamodb.toDynamoDBJson($ctx.args.productId),
              ":from": $util.dynamodb.toDynamoDBJson($ctx.args.from),
              ":to": $util.dynamodb.toDynamoDBJson($ctx.args.to)
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    historyDataSource.createResolver('MutationPutHistory', {
      typeName: 'Mutation',
      fieldName: 'putHistory',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "productId": $util.dynamodb.toDynamoDBJson($ctx.args.productId),
            "checkTimestamp": $util.dynamodb.toDynamoDBJson($ctx.args.checkTimestamp)
          },
          "attributeValues": {
            "price": $util.dynamodb.toDynamoDBJson($ctx.args.price)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });
  }
}
