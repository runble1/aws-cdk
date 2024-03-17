// handler.ts
import { executeGraphqlRequest } from "./graphqlRequest"; // 分割したモジュールをインポート

const graphqlEndpoint = process.env.APPSYNC_ENDPOINT || "";

export async function handler() {
  const timestamp = new Date().toISOString();

  // Put Product Mutation
  const productMutationBody = JSON.stringify({
    query: `mutation PutProduct {
      putProduct(productId: "EXAMPLE123", title: "Example Product", url: "https://example.com/product", category: "Example Category", lowPrice: 100) {
        productId
        title
        url
        category
        lowPrice
      }
    }`,
  });

  await executeGraphqlRequest(productMutationBody, graphqlEndpoint);

  // Put History Mutation
  const historyMutationBody = JSON.stringify({
    query: `mutation PutHistory {
      putHistory(productId: "EXAMPLE123", checkTimestamp: "${timestamp}", price: 100) {
        productId
        checkTimestamp
        price
      }
    }`,
  });

  await executeGraphqlRequest(historyMutationBody, graphqlEndpoint);

  // Get Product Query
  const productQueryBody = JSON.stringify({
    query: `query GetProduct {
      getProduct(productId: "EXAMPLE123") {
        productId
        title
        url
        category
        lowPrice
      }
    }`,
  });

  const productData = await executeGraphqlRequest(productQueryBody, graphqlEndpoint);
  console.log("Product Data retrieved from AppSync:", productData);

  // Get History Query
  const historyQueryBody = JSON.stringify({
    query: `query GetHistory {
      getHistory(productId: "EXAMPLE123", from: "${timestamp}", to: "${timestamp}") {
        productId
        checkTimestamp
        price
      }
    }`,
  });

  const historyData = await executeGraphqlRequest(historyQueryBody, graphqlEndpoint);
  console.log("History Data retrieved from AppSync:", historyData);

  return { productData, historyData };
}
