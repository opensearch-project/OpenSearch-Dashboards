/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
import { useBottomEditorText } from '../../../../application/hooks';
import './bottom_editor.scss';

const placeholder = i18n.translate('explore.queryPanel.queryEditor.placeholder', {
  defaultMessage: 'Search using {symbol} PPL',
  values: {
    symbol: '</>',
  },
});

export const BottomEditor = () => {
  const editorMode = useSelector(selectEditorMode);
  const text = useBottomEditorText();
  const { isFocused, onWrapperClick, ...editorProps } = useBottomEditor();
  const isReadOnly = editorMode !== EditorMode.DualQuery;
  const isVisible = useSelector(selectIsDualEditorMode);
  const showPlaceholder = !text.length && !isReadOnly;

  return (
    // Suppressing below as this should only happen for click events.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      className={classNames('exploreBottomEditor', {
        ['exploreBottomEditor--readonly']: isReadOnly,
        ['exploreBottomEditor--focused']: isFocused,
        ['exploreBottomEditor--hidden']: !isVisible,
      })}
      data-test-subj="exploreBottomEditor"
      onClick={onWrapperClick}
    >
      <div className="exploreBottomEditor__overlay" />
      <CodeEditor {...editorProps} />
      {showPlaceholder ? (
        <div className="exploreBottomEditor__placeholder">{placeholder}</div>
      ) : null}
    </div>
  );
};
