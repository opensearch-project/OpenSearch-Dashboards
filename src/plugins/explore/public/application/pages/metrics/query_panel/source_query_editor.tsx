/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { Dataset } from '../../../../../../data/common';
import { DataPublicPluginStart } from '../../../../../../data/public';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { queryEditorOptions } from '../../../../components/query_panel/query_panel_editor/use_query_panel_editor/editor_options';
import { getCommandEnterAction } from '../../../../components/query_panel/query_panel_editor/use_query_panel_editor/command_enter_action';
import type {
  SourceTypeQueryEditorProps,
  SourceTypeQueryStatus,
} from '../../../../services/source_type_registry';

import '../../../../components/query_panel/query_panel_editor/query_panel_editor.scss';

const MAX_EDITOR_HEIGHT = 100;

/** A single code editor, for a source's language that brings no editor of its own. */
export const SourceCodeEditor: React.FC<SourceTypeQueryEditorProps & { languageTitle: string }> = ({
  query,
  onChange,
  onRun,
  languageId,
  languageTitle,
}) => {
  // Monaco keeps the action registered at mount, so it reads the latest onRun through a ref.
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  return (
    <div className="exploreQueryPanelEditor" data-test-subj="exploreQueryPanelEditor">
      <CodeEditor
        languageId={languageId}
        value={query}
        onChange={onChange}
        options={queryEditorOptions}
        useLatestTheme
        editorDidMount={(editor) => {
          editor.addAction(getCommandEnterAction(() => onRunRef.current()));
          editor.onDidContentSizeChange(() => {
            const contentHeight = editor.getContentHeight();
            editor.layout({
              width: editor.getLayoutInfo().width,
              height: Math.min(contentHeight, MAX_EDITOR_HEIGHT),
            });
            editor.updateOptions({
              scrollBeyondLastLine: false,
              scrollbar: { vertical: contentHeight > MAX_EDITOR_HEIGHT ? 'visible' : 'hidden' },
            });
          });
        }}
      />
      {!query && (
        <div className="exploreQueryPanelEditor__placeholder">
          {i18n.translate('explore.metricsQueryPanel.sourceCodePlaceholder', {
            defaultMessage: 'Search using </> {language}',
            values: { language: languageTitle },
          })}
        </div>
      )}
    </div>
  );
};

export interface SourceQueryEditorProps {
  /** The source's editor; the code editor when the source brings none. */
  editor?: ComponentType<SourceTypeQueryEditorProps>;
  /** The query in Redux (the last run or loaded query). */
  reduxQuery: string;
  /** Whether the user has edits that were not run yet. */
  isDirty: boolean;
  /** Called with the full query text on every edit. */
  onQueryChange: (query: string) => void;
  /** Runs `query` when given, else the query last passed to `onQueryChange`. */
  onRun: (query?: string) => void;
  languageId: string;
  languageTitle: string;
  dataset?: Dataset;
  data: DataPublicPluginStart;
  queryOptions?: Record<string, unknown>;
  onQueryOptionsChange: (options: Record<string, unknown>) => void;
  status: SourceTypeQueryStatus;
}

/**
 * The Metrics page's query editor for a registered source's language: the source's own editor, or
 * a single code editor. It keeps the draft until a query is loaded or run, like the PromQL rows.
 */
export const SourceQueryEditor: React.FC<SourceQueryEditorProps> = ({
  editor: Editor,
  reduxQuery,
  isDirty,
  onQueryChange,
  onRun,
  languageId,
  languageTitle,
  dataset,
  data,
  queryOptions,
  onQueryOptionsChange,
  status,
}) => {
  const [draft, setDraft] = useState(reduxQuery);
  const previousReduxQueryRef = useRef(reduxQuery);

  useEffect(() => {
    const queryChanged = reduxQuery !== previousReduxQueryRef.current;
    previousReduxQueryRef.current = reduxQuery;
    if (!queryChanged && isDirty) return;
    setDraft(reduxQuery);
  }, [reduxQuery, isDirty]);

  const handleChange = useCallback(
    (query: string) => {
      setDraft(query);
      onQueryChange(query);
    },
    [onQueryChange]
  );

  const handleRun = useCallback(
    (query?: string) => {
      if (query !== undefined) setDraft(query);
      onRun(query);
    },
    [onRun]
  );

  const props: SourceTypeQueryEditorProps = {
    query: draft,
    onChange: handleChange,
    onRun: handleRun,
    languageId,
    dataset,
    data,
    queryOptions,
    onQueryOptionsChange,
    status,
  };

  return (
    <div className="mqpQueryRow" data-test-subj="metricsSourceQueryEditor">
      {Editor ? (
        <Editor {...props} />
      ) : (
        <SourceCodeEditor {...props} languageTitle={languageTitle} />
      )}
    </div>
  );
};
