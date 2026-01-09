/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { monaco } from '@osd/monaco';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { DEFAULT_DATA } from '../../../../../../data/common';
import {
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
  selectQueryLanguage,
  selectQueryString,
  selectIsQueryEditorDirty,
} from '../../../../application/utils/state_management/selectors';
import { promptEditorOptions, queryEditorOptions } from './editor_options';

import { useEditorRef } from '../../../../application/hooks';
import { useLanguageSwitch } from '../../../../application/hooks/editor_hooks/use_switch_language';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { getCommandEnterAction } from './command_enter_action';
import { getShiftEnterAction } from './shift_enter_action';
import { getTabAction } from './tab_action';
import { getEnterAction } from './enter_action';
import { getSpacebarAction } from './spacebar_action';
import { setIsQueryEditorDirty } from '../../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { getEscapeAction } from './escape_action';
import { usePromptIsTyping } from './use_prompt_is_typing';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { useMultiQueryDecorations } from './use_multi_query_decorations';
import { getAutocompleteContext } from '../../../../application/utils/multi_query_utils';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type LanguageConfiguration = monaco.languages.LanguageConfiguration;
type IEditorConstructionOptions = monaco.editor.IEditorConstructionOptions;

const DEFAULT_TRIGGER_CHARACTERS = [' ', '=', "'", '"', '`'];

const languageConfiguration: LanguageConfiguration = {
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '`', close: '`' },
  ],
  comments: {
    lineComment: '//', // line comment
    blockComment: ['/*', '*/'], // block comment
  },
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
  promptIsTyping: boolean;
  suggestionProvider: monaco.languages.CompletionItemProvider;
  showPlaceholder: boolean;
  useLatestTheme: true;
  value: string;
}

export const useQueryPanelEditor = (): UseQueryPanelEditorReturnType => {
  const { promptIsTyping, handleChangeForPromptIsTyping } = usePromptIsTyping();
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { keyboardShortcut } = services;
  const userQueryString = useSelector(selectQueryString);
  const [editorText, setEditorText] = useState<string>(userQueryString);
  const [editorIsFocused, setEditorIsFocused] = useState(false);
  const {
    data: {
      dataViews,
      query: { queryString },
    },
  } = services;
  const { updateDecorations, clearDecorations } = useMultiQueryDecorations();
  // The 'onRun' functions in editorDidMount uses the context values when the editor is mounted.
  // Using a ref will ensure it always uses the latest value
  const editorTextRef = useRef(editorText);
  const queryLanguage = useSelector(selectQueryLanguage);
  const dispatch = useDispatch();
  const editorRef = useEditorRef();
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const isQueryMode = !isPromptMode;
  const isPromptModeRef = useRef(isPromptMode);
  const promptModeIsAvailableRef = useRef(promptModeIsAvailable);
  const queryLanguageRef = useRef(queryLanguage);
  const isQueryEditorDirty = useSelector(selectIsQueryEditorDirty);

  const switchEditorMode = useLanguageSwitch();

  // Keep the refs updated with latest context
  useEffect(() => {
    editorTextRef.current = editorText;
  }, [editorText]);
  useEffect(() => {
    isPromptModeRef.current = isPromptMode;
  }, [isPromptMode]);
  useEffect(() => {
    promptModeIsAvailableRef.current = promptModeIsAvailable;
  }, [promptModeIsAvailable]);
  useEffect(() => {
    queryLanguageRef.current = queryLanguage;
  }, [queryLanguage]);

  keyboardShortcut?.useKeyboardShortcut({
    id: 'focus_query_bar',
    pluginId: 'explore',
    name: i18n.translate('explore.queryPanelEditor.focusQueryBarShortcut', {
      defaultMessage: 'Focus query bar',
    }),
    category: i18n.translate('explore.queryPanelEditor.searchCategory', {
      defaultMessage: 'Search',
    }),
    keys: '/',
    execute: () => {
      editorRef.current?.focus();
    },
  });

  // The 'triggerSuggestOnFocus' prop of CodeEditor only happens on mount, so I am intentionally not passing it
  // and programmatically doing it here. We should only trigger autosuggestion on focus while on isQueryMode and there is text
  useEffect(() => {
    if (isQueryMode) {
      const onDidFocusDisposable = editorRef.current?.onDidFocusEditorWidget(() => {
        editorRef.current?.trigger('keyboard', 'editor.action.triggerSuggest', {});
      });

      if (!editorText) {
        editorRef.current?.trigger('keyboard', 'editor.action.triggerSuggest', {});
      }

      return () => {
        onDidFocusDisposable?.dispose();
      };
    }
  }, [isQueryMode, editorRef, editorText]);

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
      if (token.isCancellationRequested) {
        return { suggestions: [], incomplete: false };
      }
      try {
        // Get the effective language for autocomplete (PPL -> PPL_Simplified for explore app)
        const effectiveLanguage = getEffectiveLanguageForAutoComplete(
          isPromptModeRef.current ? 'AI' : queryLanguage,
          'explore'
        );

        // Get the current dataset from Query Service to avoid stale closure values
        const currentDataset = queryString.getQuery().dataset;
        const currentDataView = await dataViews.get(
          currentDataset?.id!,
          currentDataset?.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
        );

        const autocompleteCtx = getAutocompleteContext(
          model.getValue(),
          model.getOffsetAt(position),
          position.lineNumber,
          position.column,
          queryLanguage
        );

        // Use the current Dataset to avoid stale data
        const suggestions = await services?.data?.autocomplete?.getQuerySuggestions({
          query: autocompleteCtx.queryText,
          selectionStart: autocompleteCtx.selectionStart,
          selectionEnd: autocompleteCtx.selectionEnd,
          language: effectiveLanguage,
          baseLanguage: queryLanguage, // Pass the original language before transformation
          indexPattern: currentDataView,
          datasetType: currentDataset?.type,
          position: new monaco.Position(autocompleteCtx.lineNumber, autocompleteCtx.column),
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
    [isPromptModeRef, queryLanguage, queryString, dataViews, services]
  );

  const suggestionProvider = useMemo(() => {
    const languageTriggerCharacters = services?.data?.autocomplete?.getTriggerCharacters(
      queryLanguage
    );
    return {
      triggerCharacters: isPromptMode
        ? ['=']
        : languageTriggerCharacters ?? DEFAULT_TRIGGER_CHARACTERS,
      provideCompletionItems,
    };
  }, [isPromptMode, provideCompletionItems, queryLanguage, services]);

  const handleRun = useCallback(() => {
    dispatch(onEditorRunActionCreator(services, editorTextRef.current));
  }, [dispatch, services]);

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
        getSpacebarAction(promptModeIsAvailableRef, isPromptModeRef, editorTextRef, () =>
          switchEditorMode(EditorMode.Prompt)
        )
      );

      // Add Escape key handling to switch to query mode
      editor.addAction(getEscapeAction(isPromptModeRef, () => switchEditorMode(EditorMode.Query)));

      // Apply multi-query decorations on mount
      updateDecorations(editor, queryLanguageRef.current);

      // Update decorations when content changes
      const contentChangeDisposable = editor.onDidChangeModelContent(() => {
        updateDecorations(editor, queryLanguageRef.current);
      });

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

        // Automatically scroll to the bottom when new lines are added
        if (contentHeight > finalHeight) {
          const cursorLine = editor.getPosition()?.lineNumber || 0;
          const visibleRanges = editor.getVisibleRanges();

          if (visibleRanges.length > 0) {
            // use index 0 since we did not introduce code folding in our monaco editor
            const firstVisibleLine = visibleRanges[0].startLineNumber;
            const lastVisibleLine = visibleRanges[0].endLineNumber;

            // Only reveal if cursor is outside the visible range
            if (cursorLine < firstVisibleLine || cursorLine > lastVisibleLine) {
              editor.revealLine(cursorLine);
            }
          }
        }
      });

      return () => {
        focusDisposable.dispose();
        blurDisposable.dispose();
        contentChangeDisposable.dispose();
        clearDecorations(editor);
        return editor;
      };
    },
    [
      setEditorRef,
      handleRun,
      switchEditorMode,
      setEditorIsFocused,
      updateDecorations,
      clearDecorations,
    ]
  );

  const options = useMemo(() => {
    if (isQueryMode) {
      return queryEditorOptions;
    } else {
      return promptEditorOptions;
    }
  }, [isQueryMode]);

  const placeholder = useMemo(() => {
    const enabledPromptPlaceholder = i18n.translate(
      'explore.queryPanel.queryPanelEditor.enabledPromptPlaceholder',
      {
        defaultMessage: 'Press `space` to Ask AI with natural language, or search with {language}',
        values: {
          language: queryLanguage,
        },
      }
    );
    const disabledPromptPlaceholder = i18n.translate(
      'explore.queryPanel.queryPanelEditor.disabledPromptPlaceholder',
      {
        defaultMessage: 'Search using {symbol} {language}',
        values: {
          symbol: '</>',
          language: queryLanguage,
        },
      }
    );
    const promptModePlaceholder = i18n.translate(
      'explore.queryPanel.queryPanelEditor.promptPlaceholder',
      {
        defaultMessage: 'Ask AI with natural language. `Esc` to clear and search with {language}',
        values: {
          language: queryLanguage,
        },
      }
    );

    if (!promptModeIsAvailable) {
      return disabledPromptPlaceholder;
    }

    return isPromptMode ? promptModePlaceholder : enabledPromptPlaceholder;
  }, [isPromptMode, promptModeIsAvailable, queryLanguage]);

  const onEditorClick = useCallback(() => {
    editorRef.current?.focus();
  }, [editorRef]);

  const onChange = useCallback(
    (newText: string) => {
      setEditorText(newText);

      if (!isQueryEditorDirty) {
        dispatch(setIsQueryEditorDirty(true));
      }

      if (isPromptMode) {
        handleChangeForPromptIsTyping();
      }
    },
    [setEditorText, isPromptMode, handleChangeForPromptIsTyping, isQueryEditorDirty, dispatch]
  );

  return {
    editorDidMount,
    isFocused: editorIsFocused,
    isPromptMode,
    languageConfiguration,
    languageId: isPromptMode ? 'AI' : queryLanguage,
    onChange,
    onEditorClick,
    options,
    placeholder,
    promptIsTyping,
    suggestionProvider,
    showPlaceholder: !editorText.length,
    useLatestTheme: true,
    value: editorText,
  };
};
