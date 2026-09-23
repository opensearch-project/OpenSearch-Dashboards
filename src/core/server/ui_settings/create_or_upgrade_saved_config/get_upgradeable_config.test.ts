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

import { getUpgradeableConfig } from './get_upgradeable_config';
import { savedObjectsClientMock } from '../../saved_objects/service/saved_objects_client.mock';

describe('getUpgradeableConfig', () => {
  it('finds saved objects with type "config"', async () => {
    const savedObjectsClient = savedObjectsClientMock.create();
    savedObjectsClient.find.mockResolvedValue({
      saved_objects: [{ id: '7.5.0' }],
    } as any);

    await getUpgradeableConfig({ savedObjectsClient, version: '7.5.0' });
    expect(savedObjectsClient.find.mock.calls[0][0].type).toBe('config');
  });

  it('finds saved config with version < than OpenSearch Dashboards version', async () => {
    const savedConfig = { id: '7.4.0' };
    const savedObjectsClient = savedObjectsClientMock.create();
    savedObjectsClient.find.mockResolvedValue({
      saved_objects: [savedConfig],
    } as any);

    const result = await getUpgradeableConfig({ savedObjectsClient, version: '7.5.0' });
    expect(result).toBe(savedConfig);
  });

  it('finds saved config with RC version === OpenSearch Dashboards version', async () => {
    const savedConfig = { id: '7.5.0-rc1' };
    const savedObjectsClient = savedObjectsClientMock.create();
    savedObjectsClient.find.mockResolvedValue({
      saved_objects: [savedConfig],
    } as any);

    const result = await getUpgradeableConfig({ savedObjectsClient, version: '7.5.0' });
    expect(result).toBe(savedConfig);
  });

  it('does not find saved config with version === OpenSearch Dashboards version', async () => {
    const savedConfig = { id: '7.5.0' };
    const savedObjectsClient = savedObjectsClientMock.create();
    savedObjectsClient.find.mockResolvedValue({
      saved_objects: [savedConfig],
    } as any);

    const result = await getUpgradeableConfig({ savedObjectsClient, version: '7.5.0' });
    expect(result).toBe(undefined);
  });

  it('does not find saved config with version > OpenSearch Dashboards version', async () => {
    const savedConfig = { id: '7.6.0' };
    const savedObjectsClient = savedObjectsClientMock.create();
    savedObjectsClient.find.mockResolvedValue({
      saved_objects: [savedConfig],
    } as any);

    const result = await getUpgradeableConfig({ savedObjectsClient, version: '7.5.0' });
    expect(result).toBe(undefined);
  });

  it('handles empty config', async () => {
    const savedObjectsClient = savedObjectsClientMock.create();
    savedObjectsClient.find.mockResolvedValue({
      saved_objects: [],
    } as any);

    const result = await getUpgradeableConfig({ savedObjectsClient, version: '7.5.0' });
    expect(result).toBe(undefined);
  });

  // The find() above sorts on buildNum, which is mapped as a keyword and so
  // orders bytewise. These cases pin the ordering to the config version
  // instead, so the result no longer depends on what buildNum held.
  describe('ordering', () => {
    const findInOrder = async (ids: string[], version: string) => {
      const savedObjectsClient = savedObjectsClientMock.create();
      savedObjectsClient.find.mockResolvedValue({
        saved_objects: ids.map((id) => ({ id })),
      } as any);
      const result = await getUpgradeableConfig({ savedObjectsClient, version });
      return result?.id;
    };

    it('picks the newest upgradeable config regardless of the order returned', async () => {
      expect(await findInOrder(['1.3.0', '3.1.0', '2.19.0'], '3.5.0')).toBe('3.1.0');
      expect(await findInOrder(['3.1.0', '2.19.0', '1.3.0'], '3.5.0')).toBe('3.1.0');
    });

    it('compares versions numerically rather than bytewise', async () => {
      // '9' > '1' bytewise, so a string sort would pick 2.9.0 over 2.19.0.
      expect(await findInOrder(['2.9.0', '2.19.0'], '3.5.0')).toBe('2.19.0');
    });

    it('prefers a current-line config over a higher-numbered pre-fork one', async () => {
      // 7.10.2 is upgradeable into OSD 3.x and outranks 2.19.0 in semver, but
      // it is from the pre-fork line so it is the worse upgrade source.
      expect(await findInOrder(['7.10.2', '2.19.0'], '3.5.0')).toBe('2.19.0');
      expect(await findInOrder(['2.19.0', '7.10.2'], '3.5.0')).toBe('2.19.0');
    });

    it('falls back to a pre-fork config when it is the only candidate', async () => {
      expect(await findInOrder(['7.10.2', '6.8.0'], '3.5.0')).toBe('7.10.2');
    });

    it('ranks a release above its own release candidates', async () => {
      expect(await findInOrder(['3.4.0-rc1', '3.4.0', '3.4.0-rc2'], '3.5.0')).toBe('3.4.0');
    });

    it('ignores candidates that are not upgradeable', async () => {
      // Higher than the target, and ids that are not versions at all.
      expect(await findInOrder(['3.7.0', 'dashboard-admin', '3.1.0'], '3.5.0')).toBe('3.1.0');
    });
  });
});
