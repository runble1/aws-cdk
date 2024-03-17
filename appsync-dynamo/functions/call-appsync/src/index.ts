import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";

const region = "ap-northeast-1";
const graphqlEndpoint = process.env.APPSYNC_ENDPOINT || "";

const query = JSON.stringify({
  query: `query GetProduct {
    getProduct(productId: "EXAMPLE123") {
      productId
      Price
      Title
      URL
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

  try {
    const response = await fetch(endpointUrl.toString(), {
      method: signedRequest.method,
      headers: {
        ...signedRequest.headers,
        "host": endpointUrl.hostname // 明示的にHostヘッダーを追加
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
