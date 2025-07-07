/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import { useBottomEditor } from '../../utils';
import {
  selectEditorMode,
  selectIsDualEditorMode,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { useEditorContextByEditorComponent } from '../../../../application/context';

const placeholder = i18n.translate('explore.queryPanel.queryEditor.placeholder', {
  defaultMessage: 'Search using {symbol} PPL',
  values: {
    symbol: '</>',
  },
});

export const BottomEditor = () => {
  const editorMode = useSelector(selectEditorMode);
  const { bottomEditorRef, bottomEditorText } = useEditorContextByEditorComponent();
  const { isFocused, ...editorProps } = useBottomEditor();
  // TODO: change me
  const editorClassPrefix = 'queryEditor';
  const isReadOnly = editorMode !== EditorMode.DualQuery;
  const isVisible = useSelector(selectIsDualEditorMode);
  const showPlaceholder = !bottomEditorText.length && !isReadOnly;

  useEffect(() => {
    if (editorMode === EditorMode.DualQuery) {
      bottomEditorRef.current?.focus();
    }
  }, [editorMode, bottomEditorRef]);

  return (
    <div
      className={classNames(`${editorClassPrefix}Wrapper`, {
        [`${editorClassPrefix}Wrapper--hidden`]: !isVisible,
      })}
    >
      <div
        className={classNames(editorClassPrefix, {
          [`${editorClassPrefix}--readonly`]: isReadOnly,
          [`${editorClassPrefix}--focused`]: isFocused,
        })}
        data-test-subj="exploreReusableEditor"
      >
        <CodeEditor {...editorProps} />
        {showPlaceholder ? (
          <div className={`${editorClassPrefix}__placeholder`}>{placeholder}</div>
        ) : null}
      </div>
    </div>
  );
};
