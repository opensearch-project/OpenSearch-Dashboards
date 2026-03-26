/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiIcon, EuiText } from '@elastic/eui';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useEditorFocus } from '../../../application/hooks';
import '../../../components/query_panel/query_panel_generated_query/query_panel_generated_query.scss';
import { EditorMode } from '../../utils/state_management/types';

const editQueryText = i18n.translate('explore.queryPanel.queryPanelGeneratedQuery.editQuery', {
  defaultMessage: 'Replace query',
});

export const QueryPanelGeneratedQuery = () => {
  const { queryEditorState, queryBuilder } = useQueryBuilderState();

  const lastExecutedTranslatedQuery = queryEditorState.lastExecutedTranslatedQuery;
  const focusOnEditor = useEditorFocus();

  const { setEditorText } = useEditorOperations();
  if (!lastExecutedTranslatedQuery) {
    return null;
  }

  const onEditClick = () => {
    setEditorText(lastExecutedTranslatedQuery);

    queryBuilder.updateQueryEditorState({
      editorMode: EditorMode.Query,
      lastExecutedTranslatedQuery: undefined,
    });
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
