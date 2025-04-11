/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const EventEmitter = require('events').EventEmitter;
const expect = require('chai').expect;
const Host = require('elasticsearch/src/lib/host');
const sinon = require('sinon');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');

const Connector = require('./connector');

describe('constructor', function () {
  it('throws when no host is provided', function () {
    expect(() => new Connector()).to.throw();
  });

  it('assigns httpOptions', function () {
    const httpOptions = { foo: 'bar' };
    const host = new Host();
    const connector = new Connector(host, { httpOptions });

    expect(connector.httpOptions).to.deep.equal(httpOptions);
  });
});

describe('request', function () {
  let connector;
  beforeEach(function () {
    // Instead of AWS.config.update, we'll configure the region through the connector
    const host = new Host();
    connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    // Mock the credentials
    sinon.stub(connector, 'getAWSCredentials').resolves({
      accessKeyId: 'abc',
      secretAccessKey: 'abc',
      // Optional if you need session tokens in your tests
      // sessionToken: 'token'
    });

    this.signRequest = sinon.stub(connector, 'signRequest');
  });

  it('calls callback with error', function (done) {
    const error = new Error();
    const fakeReq = new EventEmitter();

    fakeReq.setNoDelay = sinon.stub();
    fakeReq.setSocketKeepAlive = sinon.stub();

    sinon.stub(connector.httpClient, 'handle').callsFake(function (request, options, callback) {
      callback(error);
      return fakeReq;
    });

    connector.request({}, function (err) {
      try {
        expect(err).to.deep.equal(error);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});

describe('createRequest', () => {
  it('should correctly extend reqParams passed in', () => {
    const host = new Host();
    const connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    const reqParams = {
      method: 'GET',
      path: '/_search',
      body: {
        query: {
          match_all: {},
        },
      },
    };

    const request = connector.createRequest(reqParams);

    expect(request).to.deep.equal({
      method: 'GET',
      path: '/_search',
      body: '{"query":{"match_all":{}}}',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
});
