/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useMemo } from 'react';
import { EditorContext } from '../../../context';

/**
 * Gives the refs of both editors
 */
export const useEditorRefs = () => {
  const { bottomEditorRef, topEditorRef } = useContext(EditorContext);

  return useMemo(() => ({ bottomEditorRef, topEditorRef }), [bottomEditorRef, topEditorRef]);
};
