/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { useSelector } from '../../../legacy/discover/application/utils/state_management';
import {
  selectEditorMode,
  selectQuery,
  selectIsQueryEditorDirty,
} from '../../../utils/state_management/selectors';
import { DataViewField, IndexPatternField } from '../../../../../../data/common';
import { opensearchFilters } from '../../../../../../data/public';
import { useDatasetContext } from '../../../context';
import { EditorMode } from '../../../utils/state_management/types';
import { useSetEditorText } from '../use_set_editor_text';
import { useEditorFocus } from '../use_editor_focus';
import { setIsQueryEditorDirty } from '../../../utils/state_management/slices/query_editor';

export const useChangeQueryEditor = () => {
  const {
    services: {
      data: {
        query: { filterManager, queryString },
      },
    },
  } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();
  const setEditorText = useSetEditorText();
  const editorMode = useSelector(selectEditorMode);
  const query = useSelector(selectQuery);
  const focusOnEditor = useEditorFocus();
  const dispatch = useDispatch();
  const isQueryEditorDirty = useSelector(selectIsQueryEditorDirty);

  const onAddFilter = useCallback(
    (field: string | IndexPatternField | DataViewField, values: string, operation: '+' | '-') => {
      if (!dataset) return;
      const languageConfig = queryString.getLanguageService().getLanguage(query.language);
      if (!languageConfig) return;

      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        dataset.id ?? ''
      );
      setEditorText((text) => {
        const newText =
          editorMode === EditorMode.Prompt
            ? languageConfig.addFiltersToPrompt?.(text, newFilters)
            : languageConfig.addFiltersToQuery?.(text, newFilters);
        if (newText) return newText;
        return text;
      });

      // Set isDirty to true when adding filters, but only if it's not already dirty
      if (!isQueryEditorDirty) {
        dispatch(setIsQueryEditorDirty(true));
      }

      focusOnEditor();
    },
    [
      dataset,
      queryString,
      query.language,
      filterManager,
      setEditorText,
      focusOnEditor,
      editorMode,
      dispatch,
      isQueryEditorDirty,
    ]
  );

  return { onAddFilter };
};
