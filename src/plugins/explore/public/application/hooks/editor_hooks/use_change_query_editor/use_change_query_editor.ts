/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { useSelector } from '../../../legacy/discover/application/utils/state_management';
import { selectEditorMode, selectQuery } from '../../../utils/state_management/selectors';
import { IndexPatternField } from '../../../../../../data/common';
import { opensearchFilters } from '../../../../../../data/public';
import { useIndexPatternContext } from '../../../components/index_pattern_context';
import { EditorMode } from '../../../utils/state_management/types';
import { useEditorQueryText } from '../use_editor_query_text';
import { useEditorPromptText } from '../use_editor_prompt_text';
import { useSetEditorText } from '../use_set_editor_text';

export const useChangeQueryEditor = () => {
  const {
    services: {
      data: {
        query: { filterManager, queryString },
      },
    },
  } = useOpenSearchDashboards<ExploreServices>();
  const { indexPattern } = useIndexPatternContext();
  const editorQuery = useEditorQueryText();
  const editorPrompt = useEditorPromptText();
  const setEditorText = useSetEditorText();
  const editorMode = useSelector(selectEditorMode);
  const query = useSelector(selectQuery);

  const onAddFilter = useCallback(
    (field: string | IndexPatternField, values: string, operation: '+' | '-') => {
      if (!indexPattern) return;

      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        indexPattern.id ?? ''
      );
      const languageConfig = queryString.getLanguageService().getLanguage(query.language);
      const newText =
        editorMode === EditorMode.SinglePrompt || editorMode === EditorMode.DualPrompt
          ? languageConfig?.addFiltersToPrompt?.(editorPrompt, newFilters)
          : languageConfig?.addFiltersToQuery?.(editorQuery, newFilters);
      if (newText) setEditorText(newText);
    },
    [
      editorQuery,
      editorPrompt,
      editorMode,
      filterManager,
      indexPattern,
      query.language,
      queryString,
      setEditorText,
    ]
  );

  return { onAddFilter };
};
