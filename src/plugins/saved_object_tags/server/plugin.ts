/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, Plugin } from '../../../core/server';
import { TAG_ANNOTATION_TYPE } from '../common';

export class SavedObjectTagsPlugin implements Plugin<void, void> {
  public setup(core: CoreSetup) {
    if (!core.savedObjects.annotations.enabled) {
      throw new Error(
        '`savedObjectTags.enabled` requires `savedObjects.annotations.enabled` to be true.'
      );
    }

    core.savedObjects.annotations.registerAnnotationType({
      type: TAG_ANNOTATION_TYPE,
      supportedObjectTypes: ['dashboard', 'visualization'],
      uniqueName: true,
    });
  }

  public start() {}
  public stop() {}
}
