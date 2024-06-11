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

import { getKeystore } from './get_keystore';
import { Logger } from '../cli_plugin/lib/logger';
import fs from 'fs';
import sinon from 'sinon';
import { getConfigDirectory, getDataPath } from '@osd/utils';
import { join } from 'path';

describe('get_keystore', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(Logger.prototype, 'log');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('uses the config directory if there is no pre-existing keystore', () => {
    const configKeystore = join(getConfigDirectory(), 'opensearch_dashboards.keystore');
    const dataKeystore = join(getDataPath(), 'opensearch_dashboards.keystore');
    sandbox.stub(fs, 'existsSync').returns(false);
    expect(getKeystore()).toContain(configKeystore);
    expect(getKeystore()).not.toContain(dataKeystore);
  });

  it('uses the data directory if there is a pre-existing keystore in the data directory', () => {
    const configKeystore = join(getConfigDirectory(), 'opensearch_dashboards.keystore');
    const dataKeystore = join(getDataPath(), 'opensearch_dashboards.keystore');
    sandbox.stub(fs, 'existsSync').returns(true);
    expect(getKeystore()).toContain(dataKeystore);
    expect(getKeystore()).not.toContain(configKeystore);
  });

  it('logs a deprecation warning if the data directory is used', () => {
    sandbox.stub(fs, 'existsSync').returns(true);
    getKeystore();
    sandbox.assert.calledOnce(Logger.prototype.log);
    sandbox.assert.calledWith(
      Logger.prototype.log,
      'opensearch_dashboards.keystore located in the data folder is deprecated.  Future versions will use the config folder.'
    );
  });
});
