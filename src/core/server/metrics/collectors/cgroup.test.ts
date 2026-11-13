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

import fs from 'fs';
import { loggerMock } from '@osd/logging/target/mocks';
import { OsCgroupMetricsCollector } from './cgroup';

const fsError = (code: string, syscallMessage: string, path: string) =>
  Object.assign(new Error(`${code}: ${syscallMessage}, open '${path}'`), { code, path });

// The collector reads fixed absolute paths, so stub readFile instead of touching the real FS.
// Paths are compared with `/` separators because the collector builds them with path.join.
const mockFiles = (files: Record<string, string>, deniedPrefix?: string) => {
  jest.spyOn(fs.promises, 'readFile').mockImplementation(async (path: any) => {
    const p = String(path).replace(/\\/g, '/');
    if (deniedPrefix && p.startsWith(deniedPrefix)) {
      throw fsError('EACCES', 'permission denied', p);
    }
    if (!(p in files)) {
      throw fsError('ENOENT', 'no such file or directory', p);
    }
    return Buffer.from(files[p]);
  });
};

describe('OsCgroupMetricsCollector', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns empty object when no cgroup file present', async () => {
    mockFiles({});

    const logger = loggerMock.create();
    const collector = new OsCgroupMetricsCollector({ logger });
    expect(await collector.collect()).toEqual({});
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('collects default cgroup data', async () => {
    mockFiles({
      '/proc/self/cgroup': `
123:memory:/groupname
123:cpu:/groupname
123:cpuacct:/groupname
      `,
      '/sys/fs/cgroup/cpuacct/groupname/cpuacct.usage': '111',
      '/sys/fs/cgroup/cpu/groupname/cpu.cfs_period_us': '222',
      '/sys/fs/cgroup/cpu/groupname/cpu.cfs_quota_us': '333',
      '/sys/fs/cgroup/cpu/groupname/cpu.stat': `
nr_periods 444
nr_throttled 555
throttled_time 666
      `,
    });

    const collector = new OsCgroupMetricsCollector({ logger: loggerMock.create() });
    expect(await collector.collect()).toMatchInlineSnapshot(`
      Object {
        "cpu": Object {
          "cfs_period_micros": 222,
          "cfs_quota_micros": 333,
          "control_group": "/groupname",
          "stat": Object {
            "number_of_elapsed_periods": 444,
            "number_of_times_throttled": 555,
            "time_throttled_nanos": 666,
          },
        },
        "cpuacct": Object {
          "control_group": "/groupname",
          "usage_nanos": 111,
        },
      }
    `);
  });

  it('collects override cgroup data', async () => {
    mockFiles({
      '/proc/self/cgroup': `
123:memory:/groupname
123:cpu:/groupname
123:cpuacct:/groupname
      `,
      '/sys/fs/cgroup/cpuacct/xxcustomcpuacctxx/cpuacct.usage': '111',
      '/sys/fs/cgroup/cpu/xxcustomcpuxx/cpu.cfs_period_us': '222',
      '/sys/fs/cgroup/cpu/xxcustomcpuxx/cpu.cfs_quota_us': '333',
      '/sys/fs/cgroup/cpu/xxcustomcpuxx/cpu.stat': `
nr_periods 444
nr_throttled 555
throttled_time 666
      `,
    });

    const collector = new OsCgroupMetricsCollector({
      logger: loggerMock.create(),
      cpuAcctPath: 'xxcustomcpuacctxx',
      cpuPath: 'xxcustomcpuxx',
    });
    expect(await collector.collect()).toMatchInlineSnapshot(`
      Object {
        "cpu": Object {
          "cfs_period_micros": 222,
          "cfs_quota_micros": 333,
          "control_group": "xxcustomcpuxx",
          "stat": Object {
            "number_of_elapsed_periods": 444,
            "number_of_times_throttled": 555,
            "time_throttled_nanos": 666,
          },
        },
        "cpuacct": Object {
          "control_group": "xxcustomcpuacctxx",
          "usage_nanos": 111,
        },
      }
    `);
  });

  it('returns empty object and logs error on an EACCES error', async () => {
    mockFiles(
      {
        '/proc/self/cgroup': `
123:memory:/groupname
123:cpu:/groupname
123:cpuacct:/groupname
      `,
      },
      '/sys/fs/cgroup'
    );

    const logger = loggerMock.create();

    const collector = new OsCgroupMetricsCollector({ logger });
    expect(await collector.collect()).toEqual({});
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /cgroup metrics could not be read due to error: \[Error: EACCES.*cpuacct\.usage/
      )
    );
  });
});
