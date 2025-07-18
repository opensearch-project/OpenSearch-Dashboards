/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import classNames from 'classnames';
import { EuiIcon } from '@elastic/eui';
import { CodeEditor } from '../../../../../opensearch_dashboards_react/public';
import { useQueryPanelEditor } from './use_query_panel_editor';
import './query_panel_editor.scss';

const promptIconLabel = i18n.translate('explore.queryPanel.queryPanelEditor.promptIcon', {
  defaultMessage: 'Ask AI about your data.',
});

export const QueryPanelEditor = () => {
  const {
    isFocused,
    isPromptMode,
    onEditorClick,
    placeholder,
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
      })}
      data-test-subj="exploreQueryPanelEditor"
      onClick={onEditorClick}
    >
      {isPromptMode ? (
        <EuiIcon
          type="sparkleFilled"
          size="m"
          className="exploreQueryPanelEditor__promptIcon"
          aria-label={promptIconLabel}
        />
      ) : null}
      <CodeEditor {...editorProps} />
      {showPlaceholder ? (
        <div className={`exploreQueryPanelEditor__placeholder`}>{placeholder}</div>
      ) : null}
    </div>
  );
};
