/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IEditorConstructionOptions, sharedEditorOptions } from './shared_editor_options';

export const promptEditorOptions: IEditorConstructionOptions = {
  ...sharedEditorOptions,
  lineNumbers: 'off', // Disable line numbers for NL
  folding: false, // Disable folding
  fixedOverflowWidgets: true,
  quickSuggestions: false,
};
