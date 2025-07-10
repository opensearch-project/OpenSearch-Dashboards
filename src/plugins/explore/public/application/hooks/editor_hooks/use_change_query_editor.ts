/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { useSelector } from '../../legacy/discover/application/utils/state_management';
import { selectEditorMode, selectQuery } from '../../utils/state_management/selectors';
import {
  DataViewField as DatasetField,
  IndexPatternField,
  opensearchFilters,
} from '../../../../../data/public';
import { useDatasetContext, useEditorContext } from '../../context';
import { EditorMode } from '../../utils/state_management/types';

export const useChangeQueryEditor = () => {
  const {
    services: {
      data: {
        query: { filterManager, queryString },
      },
    },
  } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();
  const editorContext = useEditorContext();
  const editorMode = useSelector(selectEditorMode);
  const query = useSelector(selectQuery);

  const onAddFilter = useCallback(
    (field: string | DatasetField | IndexPatternField, values: string, operation: '+' | '-') => {
      if (!dataset) return;

      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        dataset.id ?? ''
      );
      const languageConfig = queryString.getLanguageService().getLanguage(query.language);
      const newText =
        editorMode === EditorMode.SingleQuery || editorMode === EditorMode.DualQuery
          ? languageConfig?.addFiltersToQuery?.(editorContext.query, newFilters)
          : languageConfig?.addFiltersToPrompt?.(editorContext.prompt, newFilters);
      if (newText) editorContext.setEditorText(newText);
    },
    [editorContext, editorMode, filterManager, dataset, query.language, queryString]
  );

  return { onAddFilter };
};
