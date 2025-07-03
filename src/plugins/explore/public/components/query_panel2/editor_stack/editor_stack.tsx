/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { EuiProgress } from '@elastic/eui';
import { selectIsLoading } from '../../../application/utils/state_management/selectors';
import { TopEditor } from './top_editor';
import { BottomEditor } from './bottom_editor';
import './editor_stack.scss';

export const EditorStack = () => {
  const isLoading = useSelector(selectIsLoading);
  // TODO: testing
  // const isDualEditor = useSelector(selectIsDualEditorMode);

  return (
    <div className="queryPanel__editorStack" data-test-subj="exploreEditorStack">
      <TopEditor />
      <BottomEditor />
      <div className="queryPanel__editorStack__progress" data-test-subj="queryPanelEditorProgress">
        {isLoading && <EuiProgress size="xs" color="accent" position="absolute" />}
      </div>
    </div>
  );
};
