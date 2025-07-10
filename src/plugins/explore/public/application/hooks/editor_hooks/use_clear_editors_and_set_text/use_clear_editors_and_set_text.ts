/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SetStateAction, useCallback, useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * Clears bottom editor and sets top editor. Used when you want to go from dual editor to single
 */
export const useClearEditorsAndSetText = () => {
  const { setTopEditorText, setBottomEditorText } = useContext(EditorContext);

  return useCallback(
    (textOrCallback: SetStateAction<string>) => {
      setBottomEditorText('');
      setTopEditorText(textOrCallback);
    },
    [setBottomEditorText, setTopEditorText]
  );
};
