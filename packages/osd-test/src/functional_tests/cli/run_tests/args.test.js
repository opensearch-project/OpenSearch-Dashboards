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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { displayHelp, processOptions } from './args';
import { createAbsolutePathSerializer } from '@osd/dev-utils';

expect.addSnapshotSerializer(createAbsolutePathSerializer(process.cwd()));

const INITIAL_TEST_OPENSEARCH_FROM = process.env.TEST_OPENSEARCH_FROM;
beforeEach(() => {
  process.env.TEST_OPENSEARCH_FROM = 'snapshot';
});
afterEach(() => {
  process.env.TEST_OPENSEARCH_FROM = INITIAL_TEST_OPENSEARCH_FROM;
});

describe('display help for run tests CLI', () => {
  it('displays as expected', () => {
    expect(displayHelp()).toMatchSnapshot();
  });
});

describe('process options for run tests CLI', () => {
  it('rejects boolean config value', () => {
    expect(() => {
      processOptions({ config: true });
    }).toThrow('functional_tests: invalid argument [true] to option [config]');
  });

  it('rejects empty config value if no default passed', () => {
    expect(() => {
      processOptions({});
    }).toThrow('functional_tests: config is required');
  });

  it('accepts empty config value if default passed', () => {
    const options = processOptions({ config: '' }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('rejects non-boolean value for bail', () => {
    expect(() => {
      processOptions({ bail: 'peanut' }, ['foo']);
    }).toThrow('functional_tests: invalid argument [peanut] to option [bail]');
  });

  it('accepts string value for opensearch-dashboards-install-dir', () => {
    const options = processOptions({ 'opensearch-dashboards-install-dir': 'foo' }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('rejects boolean value for opensearch-dashboards-install-dir', () => {
    expect(() => {
      processOptions({ 'opensearch-dashboards-install-dir': true }, ['foo']);
    }).toThrow(
      'functional_tests: invalid argument [true] to option [opensearch-dashboards-install-dir]'
    );
  });

  it('accepts boolean value for updateBaselines', () => {
    const options = processOptions({ updateBaselines: true }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('accepts source value for opensearchFrom', () => {
    const options = processOptions({ opensearchFrom: 'source' }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('accepts source value for $TEST_OPENSEARCH_FROM', () => {
    process.env.TEST_OPENSEARCH_FROM = 'source';
    const options = processOptions({}, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('prioritizes source flag over $TEST_OPENSEARCH_FROM', () => {
    process.env.TEST_OPENSEARCH_FROM = 'source';
    const options = processOptions({ opensearchFrom: 'snapshot' }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('rejects non-enum value for opensearchFrom', () => {
    expect(() => {
      processOptions({ opensearchFrom: 'butter' }, ['foo']);
    }).toThrow('functional_tests: invalid argument [butter] to option [opensearchFrom]');
  });

  it('accepts value for grep', () => {
    const options = processOptions({ grep: 'management' }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('accepts debug option', () => {
    const options = processOptions({ debug: true }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('accepts silent option', () => {
    const options = processOptions({ silent: true }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('accepts quiet option', () => {
    const options = processOptions({ quiet: true }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('accepts verbose option', () => {
    const options = processOptions({ verbose: true }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('accepts extra server options', () => {
    const options = processOptions({ _: { 'server.foo': 'bar' } }, ['foo']);
    expect(options).toMatchSnapshot();
  });

  it('rejects invalid options even if valid options exist', () => {
    expect(() => {
      processOptions({ debug: true, aintnothang: true, bail: true }, ['foo']);
    }).toThrow('functional_tests: invalid option [aintnothang]');
  });
});
