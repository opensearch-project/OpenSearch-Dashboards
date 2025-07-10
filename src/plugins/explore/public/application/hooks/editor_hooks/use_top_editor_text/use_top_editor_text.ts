/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * Gives topEditor text
 */
export const useTopEditorText = () => {
  const { topEditorText } = useContext(EditorContext);

  return topEditorText;
};
