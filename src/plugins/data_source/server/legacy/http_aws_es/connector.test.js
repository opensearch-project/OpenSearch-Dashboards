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

    const request = connector.createRequest({}, reqParams);

    expect(request.path).to.equal(reqParams.path);
  });

  it('should set Content-Length as a string for a string body', () => {
    const host = new Host();
    const connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    const bodyString = '{"name": "test"}';

    // Pass the body in the first parameter (params) so that createRequest picks it up.
    const params = {
      method: 'POST',
      body: bodyString,
    };
    const reqParams = {
      method: 'POST',
      path: '/test',
      headers: {},
    };

    const request = connector.createRequest(params, reqParams);

    // Calculate the expected content length and convert it to string.
    const expectedLength = Buffer.byteLength(bodyString).toString();
    expect(request.headers).to.have.property('Content-Length');
    expect(request.headers['Content-Length']).to.be.a('string');
    expect(request.headers['Content-Length']).to.equal(expectedLength);
  });

  it('should set Content-Length as a string for a Buffer body', () => {
    const host = new Host();
    const connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    const bodyBuffer = Buffer.from('This is a test');

    // Again, place the body in the first parameter.
    const params = {
      method: 'POST',
      body: bodyBuffer,
    };
    const reqParams = {
      method: 'POST',
      path: '/test',
      headers: {},
    };

    const request = connector.createRequest(params, reqParams);

    // Calculate the expected content length for the Buffer and convert to string.
    const expectedLength = bodyBuffer.length.toString();
    expect(request.headers).to.have.property('Content-Length');
    expect(request.headers['Content-Length']).to.be.a('string');
    expect(request.headers['Content-Length']).to.equal(expectedLength);
  });

  it('should correctly separate path and query parameters', () => {
    const host = new Host();
    const connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    const params = {
      method: 'GET',
    };
    const reqParams = {
      method: 'GET',
      path: '/test?dataSourceId=sample&sort=true',
      headers: {},
    };

    const request = connector.createRequest(params, reqParams);

    // Test path separation
    expect(request.path).to.equal('/test');

    // Test query parameters
    expect(Object.keys(request.query).length).to.equal(2);
    expect(request.query.dataSourceId).to.equal('sample');
    expect(request.query.sort).to.equal('true');
  });

  it('should handle path with special characters', () => {
    const host = new Host();
    const connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    const params = {
      method: 'GET',
    };
    const reqParams = {
      method: 'GET',
      path: "/test/*/(hello')/!",
      headers: {},
    };

    const request = connector.createRequest(params, reqParams);

    expect(request.path).to.equal('/test/%2A/%28hello%27%29/%21');
  });

  it('should handle path without query parameters', () => {
    const host = new Host();
    const connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    const params = {
      method: 'GET',
    };
    const reqParams = {
      method: 'GET',
      path: '/test',
      headers: {},
    };

    const request = connector.createRequest(params, reqParams);

    expect(request.path).to.equal('/test');
    expect(request.query).to.be.empty;
  });

  it('should treat query parameter without value as empty string', () => {
    const host = new Host();
    const connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    const params = { method: 'GET' };
    const reqParams = { method: 'GET', path: '/test?v', headers: {} };

    const request = connector.createRequest(params, reqParams);

    expect(request.path).to.equal('/test');
    expect(request.query).to.have.property('v', '');
  });

  it('should treat query parameter with explicit empty value as empty string', () => {
    const host = new Host();
    const connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    const params = { method: 'GET' };
    const reqParams = { method: 'GET', path: '/test?v=', headers: {} };

    const request = connector.createRequest(params, reqParams);

    expect(request.path).to.equal('/test');
    expect(request.query).to.have.property('v', '');
  });

  it('should correctly parse standard key-value query parameters', () => {
    const host = new Host();
    const connector = new Connector(host, {
      awsConfig: {
        region: 'us-east-1',
        credentials: defaultProvider(),
      },
    });

    const params = { method: 'GET' };
    const reqParams = { method: 'GET', path: '/test?foo=bar&baz=qux', headers: {} };

    const request = connector.createRequest(params, reqParams);

    expect(request.path).to.equal('/test');
    expect(request.query).to.deep.equal({ foo: 'bar', baz: 'qux' });
  });
});
