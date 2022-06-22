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

import expect from '@osd/expect';

import { ToolingLog } from '@osd/dev-utils';
import { readConfigFile } from './read_config_file';
import { Config } from './config';

const log = new ToolingLog();

describe('readConfigFile()', () => {
  it('reads config from a file, returns an instance of Config class', async () => {
    const config = await readConfigFile(log, require.resolve('./fixtures/config.1'));
    expect(config).to.be.a(Config);
    expect(config.get('testFiles')).to.eql(['config.1']);
  });

  it('merges setting overrides into log', async () => {
    const config = await readConfigFile(log, require.resolve('./fixtures/config.1'), {
      screenshots: {
        directory: 'foo.bar',
      },
    });

    expect(config.get('screenshots.directory')).to.be('foo.bar');
  });

  it('supports loading config files from within config files', async () => {
    const config = await readConfigFile(log, require.resolve('./fixtures/config.2'));
    expect(config.get('testFiles')).to.eql(['config.1', 'config.2']);
  });

  it('throws if settings are invalid', async () => {
    try {
      await readConfigFile(log, require.resolve('./fixtures/config.invalid'));
      throw new Error('expected readConfigFile() to fail');
    } catch (err) {
      const { message } = err as Error;
      expect(message).to.match(/"foo"/);
    }
  });
});
