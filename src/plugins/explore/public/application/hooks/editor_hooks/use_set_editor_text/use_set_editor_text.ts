/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * setEditorText hook
 */
export const useSetEditorText = () => {
  const { setEditorText } = useContext(EditorContext);

  return setEditorText;
};
