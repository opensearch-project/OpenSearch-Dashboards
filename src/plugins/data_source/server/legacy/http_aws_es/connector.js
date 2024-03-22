/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A connection handler for Amazon ES.
 *
 * Uses the aws-sdk to make signed requests to an Amazon ES endpoint.
 *
 * @param client {Client} - The Client that this class belongs to
 * @param config {Object} - Configuration options
 * @param [config.protocol=http:] {String} - The HTTP protocol that this connection will use, can be set to https:
 * @class HttpConnector
 */
import { Config, Credentials } from 'aws-sdk';
const AWS = require('aws-sdk');
const HttpConnector = require('elasticsearch/src/lib/connectors/http');
const HttpClient = require('http-aws-es/src/node');
const crypto = require('crypto');

class HttpAmazonESConnector extends HttpConnector {
  constructor(host, config) {
    super(host, config);

    const protocol = host.protocol;
    const port = host.port;
    const endpoint = new AWS.Endpoint(host.host);

    if (protocol) endpoint.protocol = protocol.replace(/:?$/, ':');
    if (port) endpoint.port = port;

    this.awsConfig = config.awsConfig || AWS.config;
    this.endpoint = endpoint;
    this.httpOptions = config.httpOptions || this.awsConfig.httpOptions;
    this.httpClient = new HttpClient();
    this.service = config.service || 'es';
  }

  request(params, cb) {
    const reqParams = this.makeReqParams(params);

    let req;
    let cancelled;

    const cancel = () => {
      cancelled = true;
      req && req.abort();
    };

    const done = (err, response, status, headers) => {
      this.log.trace(params.method, reqParams, params.body, response, status);
      cb(err, response, status, headers);
    };

    // load creds
    this.getAWSCredentials(reqParams)
      .catch((e) => {
        if (e && e.message) e.message = `AWS Credentials error: ${e.message}`;
        throw e;
      })
      .then((creds) => {
        if (cancelled) {
          return;
        }

        const request = this.createRequest(params, reqParams);
        // Sign the request (Sigv4)
        this.signRequest(request, creds);

        request.headers['x-amz-content-sha256'] = crypto
          .createHash('sha256')
          .update(request.body || '', 'utf8')
          .digest('hex');

        req = this.httpClient.handleRequest(request, this.httpOptions, done);
      })
      .catch(done);

    return cancel;
  }

  getAWSCredentials(reqParams) {
    if (reqParams.headers && reqParams.headers.auth) {
      const awssigv4Cred = reqParams.headers.auth;
      const accessKeyId = awssigv4Cred.credentials.accessKeyId || null;
      const secretAccessKey = awssigv4Cred.credentials.secretAccessKey;
      const sessionToken = awssigv4Cred.credentials.sessionToken;
      const region = awssigv4Cred.region;
      this.service = awssigv4Cred.service;
      delete reqParams.headers.auth;

      this.awsConfig = new Config({
        region,
        credentials: sessionToken
          ? new Credentials({ accessKeyId, secretAccessKey, sessionToken })
          : new Credentials({ accessKeyId, secretAccessKey }),
      });
    }
    return new Promise((resolve, reject) => {
      this.awsConfig.getCredentials((err, creds) => {
        if (err) return reject(err);
        return resolve(creds);
      });
    });
  }

  createRequest(params, reqParams) {
    const request = new AWS.HttpRequest(this.endpoint);

    // copy across params
    Object.assign(request, reqParams);

    request.region = this.awsConfig.region;
    if (!request.headers) request.headers = {};
    const body = params.body;

    if (body) {
      const contentLength = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
      request.headers['Content-Length'] = contentLength;
      request.body = body;
    }
    request.headers.Host = this.endpoint.host;

    return request;
  }

  signRequest(request, creds) {
    const signer = new AWS.Signers.V4(request, this.service);
    signer.addAuthorization(creds, new Date());
  }
}

module.exports = HttpAmazonESConnector;
