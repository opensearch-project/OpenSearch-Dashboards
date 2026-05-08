/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * Mock for vega library - required because vega 6.x uses ESM which Jest cannot parse.
 */

// Chainable mock view
class MockView {
  initialize() {
    return this;
  }
  width() {
    return this;
  }
  height() {
    return this;
  }
  padding() {
    return this;
  }
  renderer() {
    return this;
  }
  hover() {
    return this;
  }
  logLevel() {
    return this;
  }
  tooltip() {
    return this;
  }
  run() {
    return this;
  }
  runAsync() {
    return Promise.resolve(this);
  }
  finalize() {
    return this;
  }
  signal() {
    return this;
  }
  addSignalListener() {
    return this;
  }
  removeSignalListener() {
    return this;
  }
  container() {
    return null;
  }
  origin() {
    return [0, 0];
  }
  data() {
    return this;
  }
  change() {
    return this;
  }
}

export const vega = {
  version: '6.2.0',
  Warn: 2,
  View: MockView,
  parse: jest.fn(() => ({})),
  loader: jest.fn(() => ({
    sanitize: (uri) => Promise.resolve({ href: uri }),
    load: () => Promise.resolve(''),
  })),
  logger: jest.fn(() => ({ warn: jest.fn(), info: jest.fn(), error: jest.fn() })),
  scheme: jest.fn(),
  expressionFunction: jest.fn(),
  changeset: () => ({ insert: jest.fn().mockReturnThis(), remove: jest.fn().mockReturnThis() }),
};

export const vegaLite = {
  version: '6.4.2',
  compile: jest.fn((spec) => ({ spec, normalized: spec })),
};

export const vegaExpressionInterpreter = jest.fn();
