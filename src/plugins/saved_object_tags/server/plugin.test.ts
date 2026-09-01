/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/server/mocks';
import { TAG_ANNOTATION_TYPE } from '../common';
import { SavedObjectTagsPlugin } from './plugin';

describe('SavedObjectTagsPlugin', () => {
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
});
