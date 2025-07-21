/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { monaco } from '@osd/monaco';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import {
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { promptEditorOptions, queryEditorOptions } from './editor_options';

import {
  useClearEditors,
  useEditorFocus,
  useEditorRef,
  useEditorText,
  useSetEditorText,
} from '../../../../application/hooks';
import { useDatasetContext } from '../../../../application/context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { getCommandEnterAction } from './command_enter_action';
import { getShiftEnterAction } from './shift_enter_action';
import { getTabAction } from './tab_action';
import { getEnterAction } from './enter_action';
import { getSpacebarAction } from './spacebar_action';
import { setEditorMode } from '../../../../application/utils/state_management/slices';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { getEscapeAction } from './escape_action';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type LanguageConfiguration = monaco.languages.LanguageConfiguration;
type IEditorConstructionOptions = monaco.editor.IEditorConstructionOptions;

const enabledPromptPlaceholder = i18n.translate(
  'explore.queryPanel.queryPanelEditor.enabledPromptPlaceholder',
  {
    defaultMessage: 'Query with PPL or press `space` for AI',
  }
);

const disabledPromptPlaceholder = i18n.translate(
  'explore.queryPanel.queryPanelEditor.disabledPromptPlaceholder',
  {
    defaultMessage: 'Search using {symbol} PPL',
    values: {
      symbol: '</>',
    },
  }
);

const promptModePlaceholder = i18n.translate(
  'explore.queryPanel.queryPanelEditor.promptPlaceholder',
  {
    defaultMessage: 'Ask AI about your data. `Esc` to return',
  }
);

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

export interface UseQueryPanelEditorReturnType {
  editorDidMount: (editor: IStandaloneCodeEditor) => () => IStandaloneCodeEditor;
  isFocused: boolean;
  isPromptMode: boolean;
  languageConfiguration: LanguageConfiguration;
  languageId: string;
  onChange: (text: string) => void;
  onEditorClick: () => void;
  options: IEditorConstructionOptions;
  placeholder: string;
  showPlaceholder: boolean;
  useLatestTheme: true;
  value: string;
}

export const useQueryPanelEditor = (): UseQueryPanelEditorReturnType => {
  const { dataset } = useDatasetContext();
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const {
    data: {
      query: { queryString },
    },
  } = services;
  const text = useEditorText();
  const { editorIsFocused, setEditorIsFocused } = useEditorFocus();
  const setEditorText = useSetEditorText();
  const clearEditors = useClearEditors();
  // The 'onRun' functions in editorDidMount uses the context values when the editor is mounted.
  // Using a ref will ensure it always uses the latest value
  const editorTextRef = useRef(text);
  const queryLanguage = useSelector(selectQueryLanguage);
  const dispatch = useDispatch();
  const editorRef = useEditorRef();
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const isQueryMode = !isPromptMode;
  const isPromptModeRef = useRef(isPromptMode);

  // Keep the refs updated with latest context
  useEffect(() => {
    editorTextRef.current = text;
  }, [text]);
  useEffect(() => {
    isPromptModeRef.current = isPromptMode;
  }, [isPromptMode]);

  // The 'triggerSuggestOnFocus' prop of CodeEditor only happens on mount, so I am intentionally not passing it
  // and programmatically doing it here. We should only trigger autosuggestion on focus while on isQueryMode and there is text
  useEffect(() => {
    if (isQueryMode && !!text.length) {
      const onDidFocusDisposable = editorRef.current?.onDidFocusEditorWidget(() => {
        editorRef.current?.trigger('keyboard', 'editor.action.triggerSuggest', {});
      });

      return () => {
        onDidFocusDisposable?.dispose();
      };
    }
  }, [isQueryMode, editorRef, text]);

  const setEditorRef = useCallback(
    (editor: IStandaloneCodeEditor) => {
      editorRef.current = editor;
    },
    [editorRef]
  );

  // Real autocomplete implementation using the data plugin's autocomplete service
  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      _: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.CompletionList> => {
      if (isPromptModeRef.current || token.isCancellationRequested) {
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
    [isPromptModeRef, queryLanguage, queryString, dataset, services]
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
    dispatch(onEditorRunActionCreator(services, editorTextRef.current));
  }, [dispatch, services]);

  const handleEscape = useCallback(() => {
    clearEditors();
    dispatch(setEditorMode(EditorMode.Query));
  }, [clearEditors, dispatch]);

  const editorDidMount = useCallback(
    (editor: IStandaloneCodeEditor) => {
      setEditorRef(editor);

      const focusDisposable = editor.onDidFocusEditorText(() => {
        setEditorIsFocused(true);
      });
      const blurDisposable = editor.onDidBlurEditorText(() => {
        setEditorIsFocused(false);
      });

      editor.addAction(getCommandEnterAction(handleRun));
      editor.addAction(getShiftEnterAction());

      // Add Tab key handling to trigger next autosuggestions after selection
      editor.addAction(getTabAction());

      // Add Enter key handling for suggestions
      editor.addAction(getEnterAction(handleRun));

      // Add Space bar key handling to switch to prompt mode
      editor.addAction(
        getSpacebarAction(isPromptModeRef, editorTextRef, () =>
          dispatch(setEditorMode(EditorMode.Prompt))
        )
      );

      // Add Escape key handling to switch to query mode
      editor.addAction(getEscapeAction(isPromptModeRef, handleEscape));

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
    [setEditorRef, handleRun, handleEscape, setEditorIsFocused, dispatch]
  );

  const onChange = useCallback(
    (newText: string) => {
      dispatch(setEditorText(newText));
    },
    [dispatch, setEditorText]
  );

  const options = useMemo(() => {
    if (isQueryMode) {
      return queryEditorOptions;
    } else {
      return promptEditorOptions;
    }
  }, [isQueryMode]);

  const placeholder = useMemo(() => {
    if (!promptModeIsAvailable) {
      return disabledPromptPlaceholder;
    }

    return isPromptMode ? promptModePlaceholder : enabledPromptPlaceholder;
  }, [isPromptMode, promptModeIsAvailable]);

  const onEditorClick = useCallback(() => {
    editorRef.current?.focus();
  }, [editorRef]);

  return {
    editorDidMount,
    isFocused: editorIsFocused,
    isPromptMode,
    languageConfiguration,
    languageId: queryLanguage,
    onChange,
    onEditorClick,
    options,
    placeholder,
    showPlaceholder: !text.length && editorIsFocused,
    useLatestTheme: true,
    value: text,
  };
};
