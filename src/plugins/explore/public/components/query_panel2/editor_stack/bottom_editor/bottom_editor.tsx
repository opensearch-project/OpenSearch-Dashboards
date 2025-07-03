/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { useBottomEditor } from '../../utils';
import {
  selectEditorMode,
  selectIsDualEditorMode,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';

export const BottomEditor = () => {
  const editorMode = useSelector(selectEditorMode);
  const editorProps = useBottomEditor();
  // TODO: so ugly
  const editorClassPrefix = 'queryEditor';
  const isReadOnly = editorMode !== EditorMode.DualQuery;
  const isVisible = useSelector(selectIsDualEditorMode);

  return (
    <div
      className={`${editorClassPrefix}Wrapper ${
        !isVisible ? `${editorClassPrefix}Wrapper--hidden` : null
      }`}
    >
      <div
        className={`${editorClassPrefix} ${isReadOnly ? `${editorClassPrefix}--readonly` : ''}`}
        data-test-subj="exploreReusableEditor"
      >
        <CodeEditor {...editorProps} />
      </div>
    </div>
  );
};
