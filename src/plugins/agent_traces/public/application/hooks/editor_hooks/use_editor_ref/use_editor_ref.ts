/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * Gives the ref of the editor
 */
export const useEditorRef = () => {
  return useContext(EditorContext);
};
