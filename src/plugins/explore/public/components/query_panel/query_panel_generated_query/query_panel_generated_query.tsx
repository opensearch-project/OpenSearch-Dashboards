/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { EuiBadge, EuiIcon, EuiText } from '@elastic/eui';
import { selectLastExecutedTranslatedQuery } from '../../../application/utils/state_management/selectors';
import { useEditorFocus, useSetEditorTextWithQuery } from '../../../application/hooks';
import { clearLastExecutedData } from '../../../application/utils/state_management/slices';
import './query_panel_generated_query.scss';

const editQueryText = i18n.translate('explore.queryPanel.queryPanelGeneratedQuery.editQuery', {
  defaultMessage: 'Edit query',
});

export const QueryPanelGeneratedQuery = () => {
  const lastExecutedTranslatedQuery = useSelector(selectLastExecutedTranslatedQuery);
  const setEditorTextWithQuery = useSetEditorTextWithQuery();
  const dispatch = useDispatch();
  const { focusOnEditor } = useEditorFocus();

  if (!lastExecutedTranslatedQuery) {
    return null;
  }

  const onEditClick = () => {
    setEditorTextWithQuery(lastExecutedTranslatedQuery);
    dispatch(clearLastExecutedData());
    focusOnEditor();
  };

  return (
    <div className="exploreQueryPanelGeneratedQuery">
      <EuiIcon type="editorCodeBlock" size="s" />
      <EuiText className="exploreQueryPanelGeneratedQuery__query" size="s">
        {lastExecutedTranslatedQuery}
      </EuiText>
      <EuiBadge
        data-test-subj="exploreQueryPanelGeneratedQuery_editQuery"
        onClick={onEditClick}
        onClickAriaLabel={editQueryText}
        color="hollow"
      >
        <div className="exploreQueryPanelGeneratedQuery__buttonTextWrapper">
          <EuiIcon type="editorCodeBlock" size="s" />
          <EuiText size="xs">{editQueryText}</EuiText>
        </div>
      </EuiBadge>
    </div>
  );
};
