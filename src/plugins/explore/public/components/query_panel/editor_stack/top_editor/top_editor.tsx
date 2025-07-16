/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import { EuiIcon } from '@elastic/eui';
import { useTopEditor } from '../../utils';
import {
  selectEditorMode,
  selectIsDualEditorMode,
  selectPromptModeIsAvailable,
  selectTopEditorIsQueryMode,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { useTopEditorText } from '../../../../application/hooks';
import { EditToolbar } from './edit_toolbar';
import './top_editor.scss';

const singleEditorPlaceholder = i18n.translate(
  'explore.queryPanel.promptEditor.singlePlaceholder',
  {
    defaultMessage: 'Ask a question or search using {symbol} PPL',
    values: {
      symbol: '</>',
    },
  }
);

const singleDisabledPromptEditorPlaceholder = i18n.translate(
  'explore.queryPanel.promptEditor.singleDisabledPromptPlaceholder',
  {
    defaultMessage: 'Search using {symbol} PPL',
    values: {
      symbol: '</>',
    },
  }
);

const promptIconLabel = i18n.translate('explore.queryPanel.promptEditor.promptIcon', {
  defaultMessage: 'Search using natural language',
});

const dualEditorPlaceholder = i18n.translate('explore.queryPanel.promptEditor.dualPlaceholder', {
  defaultMessage: 'Ask a question',
});

export const TopEditor = () => {
  const editorMode = useSelector(selectEditorMode);
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const text = useTopEditorText();
  const { isFocused, onWrapperClick, ...editorProps } = useTopEditor();
  const isReadOnly = editorMode === EditorMode.DualQuery;
  const showPlaceholder = !text.length && !isReadOnly;
  const isDualMode = useSelector(selectIsDualEditorMode);
  const isQueryMode = useSelector(selectTopEditorIsQueryMode);
  const isPromptMode = !isQueryMode;

  const placeholderText = useMemo(() => {
    if (!promptModeIsAvailable) {
      return singleDisabledPromptEditorPlaceholder;
    }

    return editorMode === EditorMode.DualPrompt ? dualEditorPlaceholder : singleEditorPlaceholder;
  }, [editorMode, promptModeIsAvailable]);

  return (
    // Suppressing below as this should only happen for click events.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      className={classNames('exploreTopEditor', {
        ['exploreTopEditor--readonly']: isReadOnly,
        ['exploreTopEditor--focused']: isFocused,
        ['exploreTopEditor--dualMode']: isDualMode,
        ['exploreTopEditor--promptMode']: isPromptMode,
      })}
      data-test-subj="exploreTopEditor"
      onClick={onWrapperClick}
    >
      <div className="exploreTopEditor__overlay" />
      {isPromptMode ? (
        <EuiIcon
          type="sparkleFilled"
          size="m"
          className="exploreTopEditor__promptIcon"
          aria-label={promptIconLabel}
        />
      ) : null}
      {isDualMode ? <EditToolbar /> : null}
      <CodeEditor {...editorProps} />
      {showPlaceholder ? (
        <div className={`exploreTopEditor__placeholder`}>{placeholderText}</div>
      ) : null}
    </div>
  );
};
