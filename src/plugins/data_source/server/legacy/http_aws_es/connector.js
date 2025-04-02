/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Credentials } from '@aws-sdk/client-sts';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
const HttpConnector = require('elasticsearch/src/lib/connectors/http');
const crypto = require('crypto');

class HttpAmazonESConnector extends HttpConnector {
  constructor(host, config) {
    super(host, config);

    const protocol = host.protocol;
    const port = host.port;

    this.endpoint = {
      protocol: protocol ? protocol.replace(/:?$/, ':') : 'https:',
      hostname: host.host,
      port: port || (protocol === 'https:' ? 443 : 80),
      path: '/',
    };

    this.awsConfig = config.awsConfig || {};
    this.httpOptions = config.httpOptions || {};
    this.httpClient = new NodeHttpHandler(this.httpOptions);
    this.service = config.service || 'es';
  }

  async request(params, cb) {
    const reqParams = this.makeReqParams(params);
    let cancelled = false;

    const cancel = () => {
      cancelled = true;
    };

    try {
      const creds = await this.getAWSCredentials(reqParams);
      if (cancelled) return;

      const request = await this.createRequest(params, reqParams);
      await this.signRequest(request, creds);

      const hash = crypto
        .createHash('sha256')
        .update(request.body || '', 'utf8')
        .digest('hex');
      request.headers['x-amz-content-sha256'] = hash;

      const { response } = await this.httpClient.handle(request);
      const body = await this.streamToString(response.body);

      this.log.trace(params.method, reqParams, params.body, body, response.statusCode);
      cb(null, body, response.statusCode, response.headers);
    } catch (err) {
      cb(err);
    }

    return cancel;
  }

  // Helper method to convert readable stream to string
  streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }

  async getAWSCredentials(reqParams) {
    if (reqParams.headers?.auth) {
      const awssigv4Cred = reqParams.headers.auth;
      const { accessKeyId, secretAccessKey, sessionToken } = awssigv4Cred.credentials;
      this.service = awssigv4Cred.service;
      delete reqParams.headers.auth;

      return new Credentials({
        accessKeyId,
        secretAccessKey,
        sessionToken,
      });
    }

    // Use default credential provider chain
    return await defaultProvider()();
  }

  createRequest(params, reqParams) {
    const request = new HttpRequest({
      ...this.endpoint,
      method: reqParams.method,
      headers: reqParams.headers || {},
      hostname: this.endpoint.hostname,
    });

    const body = params.body;
    if (body) {
      const contentLength = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
      request.headers['Content-Length'] = contentLength;
      request.body = body;
    }

    request.headers.Host = this.endpoint.hostname;

    return request;
  }

  async signRequest(request, credentials) {
    const signer = new SignatureV4({
      credentials,
      region: this.awsConfig.region,
      service: this.service,
      sha256: Sha256,
    });

    return await signer.sign(request);
  }
}

module.exports = HttpAmazonESConnector;
