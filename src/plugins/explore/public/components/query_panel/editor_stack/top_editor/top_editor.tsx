/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import { useTopEditor } from '../../utils';
import {
  selectEditorMode,
  selectPromptModeIsAvailable,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { useEditorContextByEditorComponent } from '../../../../application/context';

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

const dualEditorPlaceholder = i18n.translate('explore.queryPanel.promptEditor.dualPlaceholder', {
  defaultMessage: 'Ask a question',
});

export const TopEditor = () => {
  const editorMode = useSelector(selectEditorMode);
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const { topEditorRef, topEditorText } = useEditorContextByEditorComponent();
  const { isFocused, ...editorProps } = useTopEditor();
  // TODO: change me
  const editorClassPrefix = [EditorMode.DualPrompt, EditorMode.SinglePrompt].includes(editorMode)
    ? 'promptEditor'
    : 'queryEditor';
  const isReadOnly = editorMode === EditorMode.DualQuery;
  const showPlaceholder = !topEditorText.length && !isReadOnly;

  const placeholderText = useMemo(() => {
    if (!promptModeIsAvailable) {
      return singleDisabledPromptEditorPlaceholder;
    }

    return editorMode === EditorMode.DualPrompt ? dualEditorPlaceholder : singleEditorPlaceholder;
  }, [editorMode, promptModeIsAvailable]);

  useEffect(() => {
    if (editorMode !== EditorMode.DualQuery) {
      topEditorRef.current?.focus();
    }
  }, [editorMode, topEditorRef]);

  return (
    <div className={`${editorClassPrefix}Wrapper`}>
      <div
        className={classNames(editorClassPrefix, {
          [`${editorClassPrefix}--readonly`]: isReadOnly,
          [`${editorClassPrefix}--focused`]: isFocused,
        })}
        data-test-subj="exploreReusableEditor"
      >
        <CodeEditor {...editorProps} />
        {showPlaceholder ? (
          <div className={`${editorClassPrefix}__placeholder`}>{placeholderText}</div>
        ) : null}
      </div>
    </div>
  );
};
