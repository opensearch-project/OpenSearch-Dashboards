/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../../types';
import { useSelector } from '../../../legacy/discover/application/utils/state_management';
import {
  selectEditorMode,
  selectQuery,
  selectIsQueryEditorDirty,
} from '../../../utils/state_management/selectors';
import {
  DataViewField,
  Filter,
  IndexPatternField,
  IFieldType,
  IIndexPattern,
} from '../../../../../../data/common';
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
  } = useOpenSearchDashboards<AgentTracesServices>();
  const { dataset } = useDatasetContext();
  const setEditorText = useSetEditorText();
  const editorMode = useSelector(selectEditorMode);
  const query = useSelector(selectQuery);
  const focusOnEditor = useEditorFocus();
  const dispatch = useDispatch();
  const isQueryEditorDirty = useSelector(selectIsQueryEditorDirty);

  const onAddFilter = useCallback(
    (
      field: string | IndexPatternField | DataViewField,
      values: string | string[],
      operation: '+' | '-'
    ) => {
      if (!dataset) return;
      const languageConfig = queryString.getLanguageService().getLanguage(query.language);
      if (!languageConfig) return;

      let newFilters: Filter[];
      // Array values → build a single "phrases" filter (OR condition)
      if (Array.isArray(values) && values.length > 1) {
        const fieldObj = (typeof field === 'string' ? { name: field } : field) as IFieldType;
        const indexPattern = { id: dataset.id ?? '' } as IIndexPattern;
        const filter = opensearchFilters.buildPhrasesFilter(fieldObj, values, indexPattern);
        filter.meta.negate = operation === '-';
        newFilters = [filter];
      } else {
        const singleValue = Array.isArray(values) ? values[0] : values;
        newFilters = opensearchFilters.generateFilters(
          filterManager,
          field,
          singleValue,
          operation,
          dataset.id ?? ''
        );
      }
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
