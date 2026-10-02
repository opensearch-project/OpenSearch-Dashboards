/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/public';
import { SavedObjectTagsPlugin } from './plugin';

export {
  SavedObjectTagsStart,
  TagAssignmentModalProps,
  TagListProps,
  TagSelectorProps,
} from './types';

export const plugin = (_initializerContext: PluginInitializerContext) =>
  new SavedObjectTagsPlugin();
