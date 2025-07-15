/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { useCallback, useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  onEditorChangeActionCreator,
  onEditorRunActionCreator,
} from '../../../../application/utils/state_management/actions/query_editor';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { UseSharedEditorProps, UseSharedEditorReturnType } from '../types';
import { getCommandEnterAction } from './command_enter_action';
import { getShiftEnterAction } from './shift_enter_action';
import { getTabAction } from './tab_action';
import { getEnterAction } from './enter_action';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { useDatasetContext } from '../../../../application/context';
import {
  selectEditorMode,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import {
  useEditorRefs,
  useOnEditorRunContext,
  useSetEditorText,
  useToggleDualEditorMode,
} from '../../../../application/hooks';

type LanguageConfiguration = monaco.languages.LanguageConfiguration;
type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

const TRIGGER_CHARACTERS = [' '];

const languageConfiguration: LanguageConfiguration = {
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  wordPattern: /@?\w[\w@'.-]*[?!,;:"]*/, // Consider tokens containing . @ as words while applying suggestions. Refer https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10118#discussion_r2201428532 for details.
};

/**
 * This hook should only be used by useTopEditor and useBottomEditor
 */
export const useSharedEditor = ({
  setEditorRef,
  editorPosition,
}: UseSharedEditorProps): UseSharedEditorReturnType => {
  const { dataset } = useDatasetContext();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const {
    data: {
      query: { queryString },
    },
  } = services;
  const editorMode = useSelector(selectEditorMode);
  const toggleDualEditorMode = useToggleDualEditorMode();
  // using a ref as provideCompletionItems uses a stale version of editorMode
  const editorModeRef = useRef<EditorMode>(editorMode);
  const setEditorText = useSetEditorText();
  const onEditorRunContext = useOnEditorRunContext();
  // The 'onRun' functions in editorDidMount uses the context values when the editor is mounted.
  // Using a ref will ensure it always uses the latest value
  const onEditorRunContextRef = useRef(onEditorRunContext);
  const dispatch = useDispatch();
  const [isFocused, setIsFocused] = useState(false);
  const queryLanguage = useSelector(selectQueryLanguage);
  const { topEditorRef, bottomEditorRef } = useEditorRefs();

  // Keep the refs updated with latest context
  useEffect(() => {
    editorModeRef.current = editorMode;
  }, [editorMode]);
  useEffect(() => {
    onEditorRunContextRef.current = onEditorRunContext;
  }, [onEditorRunContext]);

  // Real autocomplete implementation using the data plugin's autocomplete service
  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      _: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.CompletionList> => {
      if (
        (editorPosition === 'top' && editorModeRef.current !== EditorMode.SingleQuery) ||
        (editorPosition === 'bottom' && editorModeRef.current !== EditorMode.DualQuery) ||
        token.isCancellationRequested
      ) {
        return { suggestions: [], incomplete: false };
      }
      try {
        // Get the effective language for autocomplete (PPL -> PPL_Simplified for explore app)
        const effectiveLanguage = getEffectiveLanguageForAutoComplete(queryLanguage, 'explore');

        // Get the current dataset from Query Service to avoid stale closure values
        const currentDataView = queryString?.getQuery().dataset;

        // Get the current dataset from services to avoid stale closure values
        let currentDataset = dataset;
        if (currentDataView) {
          try {
            currentDataset = await services?.datasets?.get(
              currentDataView.id,
              currentDataView.type !== 'INDEX_PATTERN'
            );
          } catch (error) {
            // Fallback to the prop dataset if fetching fails
            currentDataset = dataset;
          }
        }

        // Use the current Dataset to avoid stale data
        const suggestions = await services?.data?.autocomplete?.getQuerySuggestions({
          query: model.getValue(), // Use the current editor content, using the local query results in a race condition where we can get stale query data
          selectionStart: model.getOffsetAt(position),
          selectionEnd: model.getOffsetAt(position),
          language: effectiveLanguage,
          indexPattern: currentDataset as any,
          datasetType: currentDataView?.type,
          position,
          services: services as any, // ExploreServices storage type incompatible with IDataPluginServices.DataStorage
        });

        // current completion item range being given as last 'word' at pos
        const wordUntil = model.getWordUntilPosition(position);

        const defaultRange = new monaco.Range(
          position.lineNumber,
          wordUntil.startColumn,
          position.lineNumber,
          wordUntil.endColumn
        );

        const filteredSuggestions = suggestions?.filter((s) => 'detail' in s) || [];

        const monacoSuggestions = filteredSuggestions.map((s: any) => ({
          label: s.text,
          kind: s.type as monaco.languages.CompletionItemKind,
          insertText: s.insertText ?? s.text,
          insertTextRules: s.insertTextRules ?? undefined,
          range: defaultRange,
          detail: s.detail,
          sortText: s.sortText,
          documentation: s.documentation
            ? {
                value: s.documentation,
                isTrusted: true,
              }
            : '',
          command: {
            id: 'editor.action.triggerSuggest',
            title: 'Trigger Next Suggestion',
          },
        }));

        return {
          suggestions: monacoSuggestions,
          incomplete: false,
        };
      } catch (autocompleteError) {
        return { suggestions: [], incomplete: false };
      }
    },
    [editorPosition, queryLanguage, services, queryString, dataset]
  );

  // We need to manually register completion provider if it gets re-created,
  // because monaco.languages.onLanguage will not trigger registration
  // callbacks if the language is the same.
  useEffect(() => {
    const disposable = monaco.languages.registerCompletionItemProvider(queryLanguage, {
      triggerCharacters: TRIGGER_CHARACTERS,
      provideCompletionItems,
    });
    return () => disposable?.dispose();
  }, [provideCompletionItems, queryLanguage]);

  const handleRun = useCallback(() => {
    dispatch(onEditorRunActionCreator(services, onEditorRunContextRef.current));
  }, [dispatch, services]);

  const editorDidMount = useCallback(
    (editor: IStandaloneCodeEditor) => {
      setEditorRef(editor);

      const focusDisposable = editor.onDidFocusEditorText(() => {
        setIsFocused(true);
      });
      const blurDisposable = editor.onDidBlurEditorText(() => {
        setIsFocused(false);
      });

      editor.addAction(getCommandEnterAction(handleRun));
      editor.addAction(getShiftEnterAction());

      // Add Tab key handling to trigger next autosuggestions after selection
      editor.addAction(getTabAction());

      // Add Enter key handling for suggestions
      editor.addAction(getEnterAction(handleRun));

      editor.onDidContentSizeChange(() => {
        const contentHeight = editor.getContentHeight();
        const maxHeight = 100;
        const finalHeight = Math.min(contentHeight, maxHeight);

        editor.layout({
          width: editor.getLayoutInfo().width,
          height: finalHeight,
        });

        editor.updateOptions({
          scrollBeyondLastLine: false,
          scrollbar: {
            vertical: contentHeight > maxHeight ? 'visible' : 'hidden',
          },
        });
      });

      return () => {
        focusDisposable.dispose();
        blurDisposable.dispose();
        return editor;
      };
    },
    [handleRun, setEditorRef]
  );

  const onChange = useCallback(
    (text: string) => {
      dispatch(onEditorChangeActionCreator(text, setEditorText));
    },
    [dispatch, setEditorText]
  );

  const onWrapperClick = useCallback(() => {
    if (
      (editorPosition === 'top' && editorMode === EditorMode.DualQuery) ||
      (editorPosition === 'bottom' && editorMode === EditorMode.DualPrompt)
    ) {
      toggleDualEditorMode();
    } else if (editorPosition === 'top') {
      topEditorRef.current?.focus();
    } else if (editorPosition === 'bottom') {
      bottomEditorRef.current?.focus();
    }
  }, [editorMode, editorPosition, toggleDualEditorMode, topEditorRef, bottomEditorRef]);

  return {
    isFocused,
    useLatestTheme: true,
    editorDidMount,
    onChange,
    onWrapperClick,
    languageConfiguration,
  };
};
