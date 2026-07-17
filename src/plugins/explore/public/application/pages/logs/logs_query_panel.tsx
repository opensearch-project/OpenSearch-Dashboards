/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiProgress } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { QueryPanelWidgets } from '../../../components/query_panel/query_panel_widgets';
import { QueryPanelEditor } from '../../../components/query_panel/query_panel_editor';
import { QueryPanelGeneratedQuery } from '../../../components/query_panel/query_panel_generated_query';
import { usePPLExecuteQueryAction } from '../../../components/query_panel/actions/ppl_execute_query_action';
import { useEditorRef, useEditorText, useSetEditorTextWithQuery } from '../../../application/hooks';
import { useSetEditorText } from '../../../application/hooks/editor_hooks/use_set_editor_text/use_set_editor_text';
import {
  selectIsLoading,
  selectIsPromptEditorMode,
  selectPromptToQueryIsLoading,
  selectQueryString,
  selectSavedSearch,
} from '../../../application/utils/state_management/selectors';
import { setIsQueryEditorDirty } from '../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { onEditorRunActionCreator } from '../../../application/utils/state_management/actions/query_editor';
import { PPLBuilder, PPLBuilderState, parsePPL } from './ppl_builder';
import { ModeToggleButton } from './ppl_builder/mode_toggle_button';
import { LogsBuilderMode } from './logs_query_panel_mode';
import '../../../components/query_panel/query_panel.scss';

// Normalize before the "did the user edit the code?" comparison in
// handleModeChange. buildPPL emits a single line with LF and no trailing
// newline, but Monaco can hand text back with a different EOL (\r\n) or a
// trailing newline depending on its config. Comparing raw would then treat an
// untouched round-trip as an edit and fall into the lossy parsePPL path,
// silently dropping partial work (fieldless metrics, `auto` spans, stale
// sorts). Whitespace/EOL differences aren't semantic edits, so fold them out.
const normalizeQueryText = (text: string) => text.replace(/\r\n?/g, '\n').trim();

/**
 * Logs query panel with a PPL visual builder / code toggle. Gated behind the
 * `logsQueryBuilder` explore dynamic feature flag (surfaced as the
 * `explore.logsQueryBuilderEnabled` capability); the plain `QueryPanel` is used
 * otherwise.
 *
 * The QueryStringManager draft (NOT Redux) is the working source of truth while
 * editing — mirroring `MetricsQueryPanel`. Builder edits deliberately do NOT
 * dispatch `setQueryState`, because the Redux query string is the results
 * cacheKey (see `useTabResults`): mutating it per keystroke re-keys the results
 * and makes the table/histogram appear empty until the next run. Results should
 * only change when the user actually runs a query.
 */
export const LogsQueryPanel: React.FC = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const queryIsLoading = useSelector(selectIsLoading);
  const promptToQueryIsLoading = useSelector(selectPromptToQueryIsLoading);
  const isLoading = queryIsLoading || promptToQueryIsLoading;
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const reduxQuery = useSelector(selectQueryString);
  const savedSearch = useSelector(selectSavedSearch);

  const editorRef = useEditorRef();
  const getEditorText = useEditorText();
  const setEditorTextWithQuery = useSetEditorTextWithQuery();
  const setEditorText = useSetEditorText();
  usePPLExecuteQueryAction(setEditorTextWithQuery);

  const { queryString } = services.data.query;

  // The `source = <index>` clause is owned by the dataset selector and hidden
  // from the builder UI. parsePPL captures it into `state.sourceClause` (verbatim)
  // and buildPPL re-emits it, so it rides through the builder round-trip without
  // being surfaced as an editable field; the execution layer (`addPPLSourceClause`)
  // still supplies it at run time when a query carries none.
  const initialParse = useMemo(() => parsePPL(reduxQuery), []); // eslint-disable-line react-hooks/exhaustive-deps

  // A query loaded from a saved object opens in code. It can still be switched
  // to Builder afterward when it is representable.
  const loadedFromSaved = !!savedSearch;
  const [mode, setMode] = useState<LogsBuilderMode>(() =>
    !loadedFromSaved && initialParse.canBuild ? 'builder' : 'code'
  );

  // The seed handed to PPLBuilder on (re)mount. Only updated when we deliberately
  // re-seed the builder (external change, mode toggle) — NOT on every keystroke,
  // so builder edits don't re-render this panel.
  const [builderState, setBuilderState] = useState<PPLBuilderState>(initialParse.state);
  // The builder's live state, updated on every edit. Read when snapshotting for a
  // Builder -> Code toggle; kept in a ref so per-keystroke edits don't re-render.
  const builderStateRef = useRef(initialParse.state);
  // Bumped whenever we re-seed builder state from a parse, so PPLBuilder remounts
  // and picks up the new initialState in its useReducer.
  const [builderKey, setBuilderKey] = useState(0);

  // Live code-editor text, tracked so the Builder toggle can enable/disable
  // itself as the user types in Code mode.
  const [liveCodeText, setLiveCodeText] = useState(reduxQuery);

  // The builder's most recent built query. Used to seed the code editor when
  // toggling Builder -> Code WITHOUT pushing to Redux (which would re-key
  // results). Also updated from external query changes.
  const builderQueryRef = useRef(reduxQuery);
  // Snapshot of the full builder state taken on a Builder -> Code toggle, keyed
  // by the exact query text it compiled to. `buildPPL` is lossy — a metric with
  // no field yet, a span's `auto` flag, or a stale sort don't survive a
  // parse(build(state)) round-trip — so re-parsing on the way back would discard
  // partial work. On Code -> Builder we restore this snapshot verbatim IFF the
  // code text is unchanged from what it produced; if the user actually edited the
  // code (so it would render differently), we fall back to parsing the new text.
  const preservedBuilderRef = useRef<{ query: string; state: PPLBuilderState } | null>(null);
  // Text to push into the code editor once it mounts after a Builder -> Code
  // toggle (the shared editor otherwise mounts with the last-run Redux query).
  const pendingCodeSeedRef = useRef<string | null>(null);

  // Re-seed the builder from a parsed state: remount PPLBuilder (via key) and keep
  // the live ref in sync so an immediate mode toggle snapshots the right state.
  const reseedBuilder = useCallback((next: PPLBuilderState) => {
    builderStateRef.current = next;
    setBuilderState(next);
    setBuilderKey((k) => k + 1);
  }, []);

  const lastDispatchedRef = useRef(reduxQuery);
  // Mirror of `mode` for use inside the external-sync effect without adding
  // `mode` to its deps (a mode toggle must NOT re-run external-sync logic —
  // that would wrongly treat the in-progress builder draft as an external
  // change and reset it).
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Reflect external query changes (dataset switch, saved-query load, AI, or a
  // cleared/new search) into the builder. We never auto-flip Code -> Builder on
  // a normal run (that is the user's choice via the toggle); we only force Code
  // when a query in Builder mode becomes unrepresentable, and return to Builder
  // on a cleared/fresh query.
  useEffect(() => {
    if (reduxQuery === lastDispatchedRef.current) return;
    lastDispatchedRef.current = reduxQuery;
    builderQueryRef.current = reduxQuery;
    setLiveCodeText(reduxQuery);

    const parsed = parsePPL(reduxQuery);
    const isEmptyBuilder =
      parsed.canBuild &&
      parsed.state.searchExpression.trim() === '' &&
      parsed.state.aggregations.length === 0 &&
      parsed.state.filters.length === 0 &&
      !parsed.state.sort;

    if (isEmptyBuilder) {
      // A cleared / fresh query returns to Builder.
      reseedBuilder(parsed.state);
      setMode('builder');
      return;
    }

    if (modeRef.current === 'builder') {
      if (parsed.canBuild) {
        reseedBuilder(parsed.state);
      } else {
        setMode('code');
      }
    }
    // In Code mode we stay in Code; the toggle stays available when canBuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduxQuery]);

  // Keep builder output in the QueryStringManager (NOT Redux) so TopNav's submit
  // reads it via queryString.getQuery().query — mirrors MetricsQueryPanel and
  // keeps the results cacheKey stable so results don't disappear while editing.
  const onBuilderChange = useCallback(
    (query: string, state: PPLBuilderState) => {
      builderStateRef.current = state;
      builderQueryRef.current = query;
      if (query === lastDispatchedRef.current) return;
      lastDispatchedRef.current = query;
      setEditorText(query);
      const currentQuery = queryString.getQuery();
      queryString.setQuery({ ...currentQuery, query });
      dispatch(setIsQueryEditorDirty(true));
    },
    [setEditorText, dispatch, queryString]
  );

  // Track the live code text (for the toggle) and seed the editor with the
  // builder draft on a Builder -> Code toggle. Uses rAF to wait for the shared
  // editor instance to mount (same approach as the metrics AI-clear path).
  useEffect(() => {
    if (mode !== 'code' || isPromptMode) return;
    let rafId = 0;
    let disposable: { dispose: () => void } | undefined;
    const attach = () => {
      const editor = editorRef.current;
      if (editor) {
        const seed = pendingCodeSeedRef.current;
        if (seed !== null) {
          pendingCodeSeedRef.current = null;
          if (editor.getValue() !== seed) setEditorText(seed);
          setLiveCodeText(seed);
        } else {
          setLiveCodeText(editor.getValue());
        }
        disposable = editor.onDidChangeModelContent(() => setLiveCodeText(editor.getValue()));
        return;
      }
      rafId = requestAnimationFrame(attach);
    };
    attach();
    return () => {
      cancelAnimationFrame(rafId);
      disposable?.dispose();
    };
  }, [mode, isPromptMode, editorRef, setEditorText]);

  // The Builder toggle is enabled whenever the live code text is representable.
  const canSwitchToBuilder = useMemo(() => parsePPL(liveCodeText).canBuild, [liveCodeText]);

  const handleModeChange = useCallback(
    (newMode: LogsBuilderMode) => {
      if (newMode === mode) return;
      if (newMode === 'code') {
        // Carry the builder's current text into the code editor on mount, and
        // snapshot the full builder state so partial work (fieldless metrics,
        // `auto` spans, stale sorts) survives an unedited round-trip back — the
        // parse(build(state)) path is lossy and would otherwise drop it. buildPPL
        // re-emits the captured source clause, so builderQueryRef already holds
        // the full query the editor should show (no reconstruction needed).
        const codeSeed = builderQueryRef.current;
        pendingCodeSeedRef.current = codeSeed;
        preservedBuilderRef.current = {
          query: codeSeed,
          state: builderStateRef.current,
        };
        setMode('code');
        return;
      }
      // Code -> Builder: parse the LIVE editor text, not the last-run query, so
      // in-progress edits carry into the builder.
      const text = getEditorText() || liveCodeText;
      // If the code is byte-for-byte what the builder last produced, the user
      // didn't edit it — restore the preserved state verbatim rather than the
      // reduced parse of it, so partial work isn't lost on a there-and-back trip.
      const preserved = preservedBuilderRef.current;
      if (preserved && normalizeQueryText(preserved.query) === normalizeQueryText(text)) {
        builderQueryRef.current = text;
        reseedBuilder(preserved.state);
        setMode('builder');
        return;
      }
      const parsed = parsePPL(text);
      if (!parsed.canBuild) return;
      builderQueryRef.current = text;
      reseedBuilder(parsed.state);
      setMode('builder');
    },
    [mode, getEditorText, liveCodeText, reseedBuilder]
  );

  // The Builder toggle is disabled when the current code text can't round-trip
  // into the builder (so the user can't switch to a mode that would lose it).
  const builderDisabled = mode === 'code' && !canSwitchToBuilder;

  const modeToggleTooltip = builderDisabled
    ? i18n.translate('explore.logsQueryPanel.cannotSwitchToBuilder', {
        defaultMessage:
          'This query cannot be represented in Builder mode. Simplify it or use Code mode.',
      })
    : undefined;

  const showBuilder = mode === 'builder' && !isPromptMode;

  const editors = (
    <div className="exploreQueryPanel__editorsWrapper">
      <QueryPanelEditor />
      <QueryPanelGeneratedQuery />
    </div>
  );

  const switchToCode = useCallback(() => handleModeChange('code'), [handleModeChange]);
  const switchToBuilder = useCallback(() => handleModeChange('builder'), [handleModeChange]);

  // Cmd/Ctrl+Enter in the builder runs the current draft, mirroring the
  // code-mode editor. The builder's query carries its source clause when it had
  // one; the execution layer (`addPPLSourceClause`) supplies it otherwise (and is
  // idempotent when present), so we hand `onEditorRunActionCreator` the builder's
  // live query text as-is.
  const handleRun = useCallback(() => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    dispatch(onEditorRunActionCreator(services, builderQueryRef.current));
  }, [dispatch, services]);

  return (
    <EuiPanel paddingSize="s" borderRadius="none" className="exploreQueryPanel">
      <EuiFlexGroup
        className="exploreQueryPanel__widgetsRow"
        gutterSize="none"
        alignItems="center"
        responsive={false}
      >
        <EuiFlexItem>
          <QueryPanelWidgets />
        </EuiFlexItem>
      </EuiFlexGroup>

      {/* The editor (`editors`) must stay in ONE reconciliation slot across prompt
          and code modes. `showBuilder` is already false in prompt mode
          (`mode === 'builder' && !isPromptMode`), so a single, non-forking tree
          keeps `<QueryPanelEditor/>` mounted when toggling AI <-> code — remounting
          it mid-type drops the natural-language prompt and the AI query never runs.
          The mode toggle is hidden in prompt mode (no code<->builder switch there). */}
      <EuiFlexGroup
        className="exploreQueryPanel__contentRow"
        gutterSize="s"
        alignItems="flexStart"
        responsive={false}
      >
        <EuiFlexItem>
          {showBuilder ? (
            <PPLBuilder
              key={builderKey}
              initialState={builderState}
              onQueryChange={onBuilderChange}
              onSwitchToCode={switchToCode}
              onRun={handleRun}
            />
          ) : (
            editors
          )}
        </EuiFlexItem>
        {!showBuilder && !isPromptMode && (
          <EuiFlexItem grow={false}>
            <ModeToggleButton
              isCode
              onToggle={switchToBuilder}
              disabled={builderDisabled}
              tooltip={modeToggleTooltip}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      {isLoading && (
        <EuiProgress
          size="xs"
          color="accent"
          position="absolute"
          data-test-subj="exploreQueryPanelIsLoading"
        />
      )}
    </EuiPanel>
  );
};
