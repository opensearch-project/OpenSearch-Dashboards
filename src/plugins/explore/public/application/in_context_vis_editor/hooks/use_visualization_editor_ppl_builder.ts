/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { PPLBuilderState, parsePPL } from '../../pages/logs/ppl_builder';
import { LogsBuilderMode } from '../../pages/logs/logs_query_panel_mode';
import { useQueryBuilderState } from './use_query_builder_state';

// Fold out EOL/whitespace so an untouched Monaco round-trip isn't mistaken for
// an edit in handleModeChange, which would fall into the lossy parsePPL path.
const normalizeQueryText = (text: string) => text.replace(/\r\n?/g, '\n').trim();

export const useVisualizationEditorPPLBuilder = (isPPLQueryMode: boolean) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryBuilder, queryState, datasetView } = useQueryBuilderState();

  // parsePPL captures the `source = <index>` clause into state.sourceClause and
  // buildPPL re-emits it, so it round-trips without being an editable field.
  const initialParse = useMemo(() => parsePPL(queryState.query), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [mode, setMode] = useState<LogsBuilderMode>('code');
  const [builderState, setBuilderState] = useState<PPLBuilderState>(initialParse.state);
  const [builderKey, setBuilderKey] = useState(0);
  const [liveCodeText, setLiveCodeText] = useState(queryState.query);

  // Builder's most recent built query, used to seed the code editor on a
  // Builder -> Code toggle without pushing to QueryBuilder.
  const builderStateRef = useRef(initialParse.state);
  const builderQueryRef = useRef(queryState.query);
  const preservedBuilderRef = useRef<{ query: string; state: PPLBuilderState } | null>(null);
  const pendingCodeSeedRef = useRef<string | null>(null);
  const lastSyncedQueryRef = useRef(queryState.query);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const reseedBuilder = useCallback((next: PPLBuilderState) => {
    builderStateRef.current = next;
    setBuilderState(next);
    setBuilderKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!isPPLQueryMode && modeRef.current === 'builder') {
      setMode('code');
    }
  }, [isPPLQueryMode]);

  // Reflect external query changes (dataset switch, saved-query load, AI, clear)
  // into the builder. We never auto-flip Code -> Builder; while in Builder we
  // reseed it, or force Code when the new query becomes unrepresentable.
  useEffect(() => {
    if (queryState.query === lastSyncedQueryRef.current) return;
    lastSyncedQueryRef.current = queryState.query;
    builderQueryRef.current = queryState.query;
    setLiveCodeText(queryState.query);

    if (modeRef.current === 'builder') {
      const parsed = parsePPL(queryState.query);
      if (parsed.canBuild) {
        reseedBuilder(parsed.state);
      } else {
        setMode('code');
      }
    }
  }, [queryState.query, reseedBuilder]);

  const handleBuilderChange = useCallback(
    (query: string, state: PPLBuilderState) => {
      builderStateRef.current = state;
      builderQueryRef.current = query;

      if (query === lastSyncedQueryRef.current) return;
      lastSyncedQueryRef.current = query;
      queryBuilder.updateQueryState({ query });
      queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });
    },
    [queryBuilder]
  );

  // Track live code text and seed the editor with the builder draft on a
  // Builder -> Code toggle, using rAF to wait for the shared editor to mount.
  useEffect(() => {
    if (mode !== 'code' || !isPPLQueryMode) return;
    let rafId = 0;
    let disposable: { dispose: () => void } | undefined;

    const attach = () => {
      const editor = queryBuilder.getEditor();
      if (editor) {
        const seed = pendingCodeSeedRef.current;
        if (seed !== null) {
          pendingCodeSeedRef.current = null;
          if (editor.getValue() !== seed) editor.setValue(seed);
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
  }, [mode, isPPLQueryMode, queryBuilder]);

  const canSwitchToBuilder = useMemo(() => parsePPL(liveCodeText).canBuild, [liveCodeText]);

  const handleModeChange = useCallback(
    (newMode: LogsBuilderMode) => {
      if (newMode === mode) return;

      if (newMode === 'code') {
        const codeSeed = builderQueryRef.current;
        pendingCodeSeedRef.current = codeSeed;
        preservedBuilderRef.current = {
          query: codeSeed,
          state: builderStateRef.current,
        };
        setMode('code');
        return;
      }
      // Code -> Builder: parse the LIVE editor text so in-progress edits carry in.
      const text = queryBuilder.getEditor()?.getValue() ?? liveCodeText;
      // If the code is byte-for-byte the builder's last output, restore the
      // preserved state verbatim rather than its lossy re-parse.
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
    [mode, queryBuilder, liveCodeText, reseedBuilder]
  );

  const handleBuilderRun = useCallback(() => {
    queryBuilder.onQueryExecutionSubmit().catch((error) => {
      services.notifications?.toasts.addError(error, {
        title: 'Query execution failed',
        toastLifeTimeMs: 2000,
      });
    });
  }, [queryBuilder, services.notifications]);

  const builderDisabled = mode === 'code' && !canSwitchToBuilder;
  const modeToggleTooltip = builderDisabled
    ? i18n.translate('explore.visEditorQueryPanel.cannotSwitchToBuilder', {
        defaultMessage:
          'This query cannot be represented in Builder mode. Simplify it or use Code mode.',
      })
    : undefined;
  const showBuilder = isPPLQueryMode && mode === 'builder';

  return {
    mode,
    showBuilder,
    builderKey,
    builderState,
    datasetOverride: datasetView.dataView,
    builderDisabled,
    modeToggleTooltip,
    handleModeChange,
    handleBuilderChange,
    handleBuilderRun,
  };
};
