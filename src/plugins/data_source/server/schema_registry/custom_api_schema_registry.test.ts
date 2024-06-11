/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomApiSchemaRegistry } from './custom_api_schema_registry';

describe('CustomApiSchemaRegistry', () => {
  let registry: CustomApiSchemaRegistry;

  beforeEach(() => {
    registry = new CustomApiSchemaRegistry();
  });

  it('allows to register and get api schema', () => {
    const sqlPlugin = () => {};
    registry.register(sqlPlugin);
    expect(registry.getAll()).toEqual([sqlPlugin]);
  });
});
