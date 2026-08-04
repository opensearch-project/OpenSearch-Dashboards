/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import classNames from 'classnames';
import { EuiToolTip } from '@elastic/eui';
import { CodeEditor } from '../../../../../opensearch_dashboards_react/public';
import { useQueryPanelEditor } from './use_query_panel_editor';
import './query_panel_editor.scss';
import { QueryEditorProps } from './types';

export const QueryPanelEditor = (props: QueryEditorProps) => {
  const { readOnly = false, readOnlyTooltip } = props;
  const {
    isFocused,
    isPromptMode,
    onEditorClick,
    placeholder,
    promptIsTyping,
    showPlaceholder,
    ...editorProps
  } = useQueryPanelEditor(props);

  const editor = (
    // Suppressing below as this should only happen for click events.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      className={classNames('exploreQueryPanelEditor', {
        ['exploreQueryPanelEditor--focused']: isFocused,
        ['exploreQueryPanelEditor--promptMode']: isPromptMode,
        ['exploreQueryPanelEditor--promptIsTyping']: promptIsTyping,
        ['exploreQueryPanelEditor--readOnly']: readOnly,
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

  if (readOnly && readOnlyTooltip) {
    return (
      <EuiToolTip content={readOnlyTooltip} position="top" display="block">
        {editor}
      </EuiToolTip>
    );
  }

  return editor;
};
