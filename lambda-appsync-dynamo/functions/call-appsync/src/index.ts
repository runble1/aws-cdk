import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";

const region = "ap-northeast-1";
const graphqlEndpoint = process.env.APPSYNC_ENDPOINT || "";

const mutation = JSON.stringify({
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

const query = JSON.stringify({
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

export async function handler() {
  const fetch = (await import("node-fetch")).default;
  const endpointUrl = new URL(graphqlEndpoint);
  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: region,
    service: "appsync",
    sha256: Sha256,
  });

  // Mutationのリクエストを準備
  const mutationRequest = new HttpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Host": endpointUrl.hostname,
    },
    hostname: endpointUrl.hostname,
    path: endpointUrl.pathname,
    body: mutation,
  });

  const signedMutationRequest = await signer.sign(mutationRequest);

  // Mutationを実行
  await fetch(endpointUrl.toString(), {
    method: signedMutationRequest.method,
    headers: {
      ...signedMutationRequest.headers,
      "host": endpointUrl.hostname
    },
    body: signedMutationRequest.body,
  });

  // Queryのリクエストを準備
  const request = new HttpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Host": endpointUrl.hostname,
    },
    hostname: endpointUrl.hostname,
    path: endpointUrl.pathname,
    body: query,
  });

  const signedRequest = await signer.sign(request);

  // Queryを実行
  try {
    const response = await fetch(endpointUrl.toString(), {
      method: signedRequest.method,
      headers: {
        ...signedRequest.headers,
        "host": endpointUrl.hostname
      },
      body: signedRequest.body,
    });

    const data = await response.json();
    console.log("Data retrieved from AppSync:", data);
    return data;
  } catch (error) {
    console.error("Error querying AppSync:", error);
    throw new Error(`Error querying AppSync: ${error}`);
  }
}
