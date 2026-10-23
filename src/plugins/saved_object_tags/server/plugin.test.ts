/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/server/mocks';
import { TAG_ANNOTATION_TYPE } from '../common';
import { configSchema } from './config';
import { SavedObjectTagsPlugin } from './plugin';

describe('SavedObjectTagsPlugin', () => {
  it('is disabled by default', () => {
    expect(configSchema.validate({})).toEqual({ enabled: false });
  });

  it('registers tags for dashboards and visualizations', () => {
    const core = coreMock.createSetup();
    const plugin = new SavedObjectTagsPlugin();

    plugin.setup(core);

    expect(core.savedObjects.annotations.registerAnnotationType).toHaveBeenCalledWith({
      type: TAG_ANNOTATION_TYPE,
      supportedObjectTypes: ['dashboard', 'visualization'],
      uniqueName: true,
    });
  });

  it('rejects enabling tags when core annotations are disabled', () => {
    const core = coreMock.createSetup();
    core.savedObjects.annotations.enabled = false;
    const plugin = new SavedObjectTagsPlugin();

    expect(() => plugin.setup(core)).toThrow(
      '`savedObjectTags.enabled` requires `savedObjects.annotations.enabled` to be true.'
    );
    expect(core.savedObjects.annotations.registerAnnotationType).not.toHaveBeenCalled();
  });
});
