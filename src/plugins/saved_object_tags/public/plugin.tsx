/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart, Plugin } from '../../../core/public';
import { TagAssignmentModal, TagList, TagSelector } from './components';
import { SavedObjectTagsStart } from './types';

export class SavedObjectTagsPlugin implements Plugin<void, SavedObjectTagsStart> {
  public setup() {}

  public start(core: CoreStart): SavedObjectTagsStart {
    return {
      ui: {
        TagSelector: (props) => (
          <TagSelector annotationService={core.savedObjects.annotations} {...props} />
        ),
        TagList: (props) => (
          <TagList annotationService={core.savedObjects.annotations} {...props} />
        ),
        TagAssignmentModal: (props) => (
          <TagAssignmentModal annotationService={core.savedObjects.annotations} {...props} />
        ),
      },
    };
  }

  public stop() {}
}
