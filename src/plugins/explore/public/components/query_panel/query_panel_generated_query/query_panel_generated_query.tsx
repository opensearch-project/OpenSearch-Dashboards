/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiIcon, EuiText } from '@elastic/eui';
import { selectLastExecutedTranslatedQuery } from '../../../application/utils/state_management/selectors';
import { useEditorFocus, useSetEditorTextWithQuery } from '../../../application/hooks';
import { clearLastExecutedData } from '../../../application/utils/state_management/slices';
import './query_panel_generated_query.scss';

const editQueryText = i18n.translate('explore.queryPanel.queryPanelGeneratedQuery.editQuery', {
  defaultMessage: 'Replace query',
});

export const QueryPanelGeneratedQuery = () => {
  const lastExecutedTranslatedQuery = useSelector(selectLastExecutedTranslatedQuery);
  const setEditorTextWithQuery = useSetEditorTextWithQuery();
  const dispatch = useDispatch();
  const focusOnEditor = useEditorFocus();

  if (!lastExecutedTranslatedQuery) {
    return null;
  }

  const onEditClick = () => {
    setEditorTextWithQuery(lastExecutedTranslatedQuery);
    dispatch(clearLastExecutedData());
    focusOnEditor(true);
  };

  return (
    <div className="exploreQueryPanelGeneratedQuery">
      <div className="exploreQueryPanelGeneratedQuery__queryWrapper">
        <EuiIcon
          type="editorCodeBlock"
          size="s"
          className="exploreQueryPanelGeneratedQuery__icon"
        />
        <EuiText
          className="exploreQueryPanelGeneratedQuery__query"
          size="s"
          data-test-subj="exploreQueryPanelGeneratedQuery"
        >
          {lastExecutedTranslatedQuery}
        </EuiText>
      </div>
      <EuiButtonEmpty
        className="exploreQueryPanelGeneratedQuery__editButton"
        data-test-subj="exploreQueryPanelGeneratedQueryEditButton"
        onClick={onEditClick}
        size="xs"
      >
        <div className="exploreQueryPanelGeneratedQuery__buttonTextWrapper">
          <EuiIcon type="sortUp" size="s" />
          <EuiText size="xs">{editQueryText}</EuiText>
        </div>
      </EuiButtonEmpty>
    </div>
  );
};
