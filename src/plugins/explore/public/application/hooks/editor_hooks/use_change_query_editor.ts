/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { useSelector } from '../../legacy/discover/application/utils/state_management';
import { selectEditorMode, selectQuery } from '../../utils/state_management/selectors';
import { IndexPatternField } from '../../../../../data/common';
import { opensearchFilters } from '../../../../../data/public';
import { useIndexPatternContext } from '../../components/index_pattern_context';
import { useEditorContext } from '../../context';
import { EditorMode } from '../../utils/state_management/types';

export const useChangeQueryEditor = () => {
  const {
    services: {
      data: {
        query: { filterManager, queryString },
      },
    },
  } = useOpenSearchDashboards<ExploreServices>();
  const { indexPattern } = useIndexPatternContext();
  const editorContext = useEditorContext();
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
        editorMode === EditorMode.SingleQuery || editorMode === EditorMode.DualQuery
          ? languageConfig?.addFiltersToQuery?.(editorContext.query, newFilters)
          : languageConfig?.addFiltersToPrompt?.(editorContext.prompt, newFilters);
      if (newText) editorContext.setEditorText(newText);
    },
    [editorContext, editorMode, filterManager, indexPattern, query.language, queryString]
  );

  return { onAddFilter };
};
