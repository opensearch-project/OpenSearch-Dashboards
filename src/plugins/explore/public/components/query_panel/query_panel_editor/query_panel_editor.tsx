/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import { CodeEditor } from '../../../../../opensearch_dashboards_react/public';
import { useQueryPanelEditor } from './use_query_panel_editor';
import './query_panel_editor.scss';

export const QueryPanelEditor = () => {
  const {
    isFocused,
    isPromptMode,
    onEditorClick,
    placeholder,
    promptIsTyping,
    showPlaceholder,
    ...editorProps
  } = useQueryPanelEditor();

  return (
    // Suppressing below as this should only happen for click events.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      className={classNames('exploreQueryPanelEditor', {
        ['exploreQueryPanelEditor--focused']: isFocused,
        ['exploreQueryPanelEditor--promptMode']: isPromptMode,
        ['exploreQueryPanelEditor--promptIsTyping']: promptIsTyping,
      })}
      data-test-subj="exploreQueryPanelEditor"
      onClick={onEditorClick}
    >
      <CodeEditor {...editorProps} />
      {showPlaceholder ? (
        <div className={`exploreQueryPanelEditor__placeholder`}>{placeholder}</div>
      ) : null}
    </div>
  );
};
