/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * Gives bottomEditor text
 */
export const useBottomEditorText = () => {
  const { bottomEditorText } = useContext(EditorContext);

  return bottomEditorText;
};
