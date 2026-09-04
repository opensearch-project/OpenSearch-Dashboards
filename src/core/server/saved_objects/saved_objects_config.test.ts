/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { savedObjectsConfig } from './saved_objects_config';

describe('savedObjectsConfig', () => {
  it('disables annotations by default', () => {
    expect(savedObjectsConfig.schema.validate({}).annotations.enabled).toBe(false);
  });
});
