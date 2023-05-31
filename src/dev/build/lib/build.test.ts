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

import { REPO_ROOT } from '@osd/utils';
import { createAbsolutePathSerializer } from '@osd/dev-utils';

import { Config } from './config';
import { Build } from './build';

expect.addSnapshotSerializer(createAbsolutePathSerializer());

const config = new Config(
  true,
  {
    darwin: false,
    linux: false,
    linuxArm: false,
    windows: false,
  },
  {
    version: '1.0.0',
    engines: {
      node: '*',
    },
    workspaces: {
      packages: [],
    },
  },
  '1.2.3',
  '1.2.3',
  REPO_ROOT,
  {
    buildNumber: 1234,
    buildSha: 'abcd1234',
    buildVersion: '1.0.0',
  },
  true
);

const linuxPlatform = config.getPlatform('linux', 'x64');
const linuxArmPlatform = config.getPlatform('linux', 'arm64');
const windowsPlatform = config.getPlatform('win32', 'x64');

beforeEach(() => {
  jest.clearAllMocks();
});

const build = new Build(config);

describe('#getName()', () => {
  it('returns opensearch-dashboards for  build', () => {
    expect(build.getName()).toBe('opensearch-dashboards');
  });
});

describe('#getLogTag()', () => {
  it('returns string with build name in it', () => {
    expect(build.getLogTag()).toContain(build.getName());
  });
});

describe('#resolvePath()', () => {
  it('uses passed config to resolve a path relative to the repo', () => {
    expect(build.resolvePath('bar')).toMatchInlineSnapshot(
      `<absolute path>/build/opensearch-dashboards/bar`
    );
  });

  it('passes all arguments to config.resolveFromRepo()', () => {
    expect(build.resolvePath('bar', 'baz', 'box')).toMatchInlineSnapshot(
      `<absolute path>/build/opensearch-dashboards/bar/baz/box`
    );
  });
});

describe('#resolvePathForPlatform()', () => {
  it('uses config.resolveFromRepo(), config.getBuildVersion(), and platform.getBuildName() to create path', () => {
    expect(build.resolvePathForPlatform(linuxPlatform, 'foo', 'bar')).toMatchInlineSnapshot(
      `<absolute path>/build/opensearch-dashboards-1.0.0-linux-x64/foo/bar`
    );
  });
});

describe('#getPlatformArchivePath()', () => {
  it('creates correct path for different platforms', () => {
    expect(build.getPlatformArchivePath(linuxPlatform)).toMatchInlineSnapshot(
      `<absolute path>/target/opensearch-dashboards-1.0.0-linux-x64.tar.gz`
    );
    expect(build.getPlatformArchivePath(linuxArmPlatform)).toMatchInlineSnapshot(
      `<absolute path>/target/opensearch-dashboards-1.0.0-linux-arm64.tar.gz`
    );
    expect(build.getPlatformArchivePath(windowsPlatform)).toMatchInlineSnapshot(
      `<absolute path>/target/opensearch-dashboards-1.0.0-windows-x64.zip`
    );
  });
});
