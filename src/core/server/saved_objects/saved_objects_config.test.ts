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

import { savedObjectsConfig } from './saved_objects_config';

describe('savedObjectsConfig', () => {
  it('rejects permission control with SQLite storage', () => {
    expect(() =>
      savedObjectsConfig.schema.validate({
        permission: { enabled: true },
        storage: { backend: 'sqlite' },
      })
    ).toThrow(
      'savedObjects.permission.enabled is not supported when savedObjects.storage.backend is "sqlite"'
    );
  });

  it('allows SQLite storage without permission control', () => {
    const config = savedObjectsConfig.schema.validate({
      storage: { backend: 'sqlite' },
    });

    expect(config.storage.backend).toBe('sqlite');
    expect(config.permission.enabled).toBe(false);
  });

  it('allows permission control with OpenSearch storage', () => {
    const config = savedObjectsConfig.schema.validate({
      permission: { enabled: true },
    });

    expect(config.storage.backend).toBe('opensearch');
    expect(config.permission.enabled).toBe(true);
  });
});
