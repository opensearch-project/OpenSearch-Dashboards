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

      // Base query text: read from the QueryStringManager draft, not the Monaco
      // editor ref. In the logs visual builder the editor is unmounted, so the
      // ref would be empty and the filter would be silently dropped — the bug
      // this fixes. Fall back to the language's default query string when empty.
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

      // Prompt (natural-language) mode is only shown with the editor mounted, so
      // keep the existing staging behavior via the prompt-filter helper.
      if (editorMode === EditorMode.Prompt) {
        setEditorText(languageConfig.addFiltersToPrompt?.(baseText, newFilters) || baseText);
        focusOnEditor();
        return;
      }

      // Each language config serializes filters into its own syntax. For PPL the
      // shared util merges value filters into the leading search expression so
      // the logs visual builder can round-trip them as chips (exists filters use
      // `| WHERE` and open in code mode).
      const newText = languageConfig.addFiltersToQuery?.(baseText, newFilters) || baseText;

      // Commit to the QueryStringManager draft (keeps TopNav submit in sync even
      // if the run below is short-circuited), mirror into the code editor when
      // mounted (no-op otherwise), then run the query so results refresh and the
      // builder re-seeds from the new Redux query.
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
