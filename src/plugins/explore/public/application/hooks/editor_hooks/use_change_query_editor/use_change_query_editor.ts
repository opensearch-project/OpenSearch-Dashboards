/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { useSelector } from '../../../legacy/discover/application/utils/state_management';
import { selectEditorMode, selectQuery } from '../../../utils/state_management/selectors';
import { AppDispatch } from '../../../utils/state_management/store';
import { DataViewField, IndexPatternField } from '../../../../../../data/common';
import { opensearchFilters } from '../../../../../../data/public';
import { useDatasetContext } from '../../../context';
import { EditorMode } from '../../../utils/state_management/types';
import { useSetEditorText } from '../use_set_editor_text';
import { useEditorFocus } from '../use_editor_focus';
import { onEditorRunActionCreator } from '../../../utils/state_management/actions/query_editor';
import { setIsQueryEditorDirty } from '../../../utils/state_management/slices/query_editor';

export const useChangeQueryEditor = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const {
    data: {
      query: { filterManager, queryString },
    },
  } = services;
  const { dataset } = useDatasetContext();
  const setEditorText = useSetEditorText();
  const editorMode = useSelector(selectEditorMode);
  const query = useSelector(selectQuery);
  const focusOnEditor = useEditorFocus();
  const dispatch = useDispatch<AppDispatch>();

  const onAddFilter = useCallback(
    (field: string | IndexPatternField | DataViewField, values: string, operation: '+' | '-') => {
      if (!dataset) return;
      const languageConfig = queryString.getLanguageService().getLanguage(query.language);
      if (!languageConfig) return;

      // Base text from the QueryStringManager draft, not the Monaco ref: in the
      // logs visual builder the editor is unmounted, so the ref would be empty and
      // the filter silently dropped. Fall back to the language default when empty.
      const currentQuery = queryString.getQuery();
      const baseText =
        (typeof currentQuery.query === 'string' && currentQuery.query) ||
        languageConfig.getQueryString?.(query) ||
        '';

      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        dataset.id ?? ''
      );

      // Prompt mode only shows with the editor mounted; keep staging via the
      // prompt-filter helper. Programmatic setValue bypasses the Monaco onChange
      // that flips the dirty flag, so mark dirty explicitly to keep TopNav on
      // "Update".
      if (editorMode === EditorMode.Prompt) {
        setEditorText(languageConfig.addFiltersToPrompt?.(baseText, newFilters) || baseText);
        dispatch(setIsQueryEditorDirty(true));
        focusOnEditor();
        return;
      }

      // Each language config serializes filters into its own syntax; PPL emits a
      // `| WHERE` command per filter, which the logs builder round-trips to chips.
      const newText = languageConfig.addFiltersToQuery?.(baseText, newFilters) || baseText;

      // Commit to the draft, mirror into the code editor (no-op when unmounted),
      // then run so results refresh and the builder re-seeds from the new query.
      queryString.setQuery({ ...currentQuery, query: newText });
      setEditorText(newText);
      dispatch(onEditorRunActionCreator(services, newText));

      focusOnEditor();
    },
    [
      dataset,
      queryString,
      query,
      filterManager,
      setEditorText,
      focusOnEditor,
      editorMode,
      dispatch,
      services,
    ]
  );

  return { onAddFilter };
};
