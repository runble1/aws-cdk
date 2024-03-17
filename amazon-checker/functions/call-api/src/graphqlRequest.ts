// graphqlRequest.ts
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import fetch from "node-fetch"; // node-fetchをインポート

const region = "ap-northeast-1";

export async function executeGraphqlRequest(body: string, graphqlEndpoint: string) {
  const endpointUrl = new URL(graphqlEndpoint);

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region,
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
    body,
  });

  const signedRequest = await signer.sign(request);

  const response = await fetch(endpointUrl.toString(), {
    method: signedRequest.method,
    headers: { ...signedRequest.headers, "host": endpointUrl.hostname },
    body: signedRequest.body,
  });

  return response.json();
}
