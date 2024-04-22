/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// treat PLUGIN_ID as a literal type 'vis-builder' rather than just string
export const PLUGIN_ID = 'vis-builder' as const;
export const PLUGIN_NAME = 'VisBuilder';
export const VISUALIZE_ID = 'visualize';
export const EDIT_PATH = '/edit';
export const VIS_BUILDER_CHART_TYPE = 'VisBuilder';

export {
  VisBuilderSavedObjectAttributes,
  VISBUILDER_SAVED_OBJECT,
} from './vis_builder_saved_object_attributes';
