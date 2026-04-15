/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';

import {
  usePromptIsTyping,
  promptEditorOptions,
  queryEditorOptions,
  useMultiQueryDecorations,
  languageConfiguration,
  DEFAULT_TRIGGER_CHARACTERS,
  UseQueryPanelEditorReturnType,
  getEditorPlaceholder,
  editorMount,
  buildCompletionItems,
} from '../../../components/query_panel/query_panel_editor';

import { EditorMode } from '../../../application/utils/state_management/types';
import { useQueryPanelContext } from '../component/query_panel/query_panel_context';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

export const useQueryPanelEditor = (): UseQueryPanelEditorReturnType => {
  const {
    services,
    queryEditorState,
    queryState,
    editorOperations: { getEditorRef, setEditorRef, switchEditorMode },
    handleQueryChange,
    handleEditorChange,
    onQuerySubmit,
  } = useQueryPanelContext();
  const { promptIsTyping, handleChangeForPromptIsTyping } = usePromptIsTyping();

  const { keyboardShortcut, notifications, data } = services;
  const { updateDecorations, clearDecorations } = useMultiQueryDecorations();

  const userQueryString = queryState.query;
  const queryLanguage = queryState.language;
  const isPromptMode = queryEditorState.editorMode === EditorMode.Prompt;
  const promptModeIsAvailable = queryEditorState.promptModeIsAvailable;
  const isQueryEditorDirty = queryEditorState.isQueryEditorDirty;

  const [editorText, setEditorText] = useState<string>(userQueryString);
  const [editorIsFocused, setEditorIsFocused] = useState(false);

  // The 'onRun' functions in editorDidMount uses the context values when the editor is mounted.
  // Using a ref will ensure it always uses the latest value
  const editorTextRef = useRef(editorText);
  const languageTitle = useMemo(() => {
    const languageService = data.query.queryString.getLanguageService();
    return languageService.getLanguage(queryLanguage)?.title ?? queryLanguage;
  }, [queryLanguage, data.query.queryString]);

  const isQueryMode = !isPromptMode;
  const isPromptModeRef = useRef(isPromptMode);
  const promptModeIsAvailableRef = useRef(promptModeIsAvailable);
  const queryLanguageRef = useRef(queryLanguage);

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
      getEditorRef()?.focus();
    },
  });

  // The 'triggerSuggestOnFocus' prop of CodeEditor only happens on mount, so I am intentionally not passing it
  // and programmatically doing it here. We should only trigger autosuggestion on focus while on isQueryMode and there is text
  useEffect(() => {
    if (isQueryMode) {
      const editor = getEditorRef();
      const onDidFocusDisposable = editor?.onDidFocusEditorWidget(() => {
        editor?.trigger('keyboard', 'editor.action.triggerSuggest', {});
      });

      return () => {
        onDidFocusDisposable?.dispose();
      };
    }
  }, [isQueryMode, getEditorRef, editorText]);

  const handleSetEditorRef = useCallback(
    (editor: IStandaloneCodeEditor) => {
      setEditorRef(editor);
    },
    [setEditorRef]
  );

  // Real autocomplete implementation using the data plugin's autocomplete service
  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      _: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.CompletionList> =>
      buildCompletionItems(model, position, _, token, {
        isPromptModeRef,
        queryLanguage,
        services: { ...data, appName: services.appName },
      }),
    [isPromptModeRef, queryLanguage, data, services.appName]
  );

  const suggestionProvider = useMemo(() => {
    const languageTriggerCharacters = data?.autocomplete?.getTriggerCharacters(queryLanguage);
    return {
      triggerCharacters: isPromptMode
        ? ['=']
        : languageTriggerCharacters ?? DEFAULT_TRIGGER_CHARACTERS,
      provideCompletionItems,
    };
  }, [isPromptMode, provideCompletionItems, queryLanguage, data]);

  const handleRun = useCallback(() => {
    // Use ref to get the latest editorMode value, avoiding stale state from React's async updates
    if (!isPromptModeRef.current) {
      handleQueryChange({ query: editorTextRef.current });
    }

    onQuerySubmit().catch((error) => {
      notifications?.toasts.addError(error, {
        title: 'Query execution failed',
      });
    });
  }, [notifications?.toasts, handleQueryChange, onQuerySubmit]);

  const handleSwitchEditorMode = useCallback(
    (mode: EditorMode) => {
      handleEditorChange({ editorMode: mode });
      switchEditorMode();
    },
    [handleEditorChange, switchEditorMode]
  );

  const editorDidMount = useCallback(
    (editor: IStandaloneCodeEditor) =>
      editorMount(
        editor,
        {
          promptModeIsAvailableRef,
          isPromptModeRef,
          editorTextRef,
          queryLanguageRef,
        },
        {
          setEditorRef: handleSetEditorRef,
          setEditorIsFocused,
          handleRun,
          switchEditorMode: handleSwitchEditorMode,
          updateDecorations,
          clearDecorations,
        }
      ),
    [
      handleSetEditorRef,
      handleRun,
      handleSwitchEditorMode,
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

  const placeholder = useMemo(
    () =>
      getEditorPlaceholder({
        isPromptMode,
        promptModeIsAvailable,
        languageTitle,
      }),
    [isPromptMode, promptModeIsAvailable, languageTitle]
  );

  const onEditorClick = useCallback(() => {
    getEditorRef()?.focus();
  }, [getEditorRef]);

  const onChange = useCallback(
    (newText: string) => {
      setEditorText(newText);

      if (!isQueryEditorDirty && handleEditorChange) {
        handleEditorChange({ isQueryEditorDirty: true });
      }

      if (isPromptMode) {
        handleChangeForPromptIsTyping();
      }
    },
    [
      setEditorText,
      isPromptMode,
      handleChangeForPromptIsTyping,
      isQueryEditorDirty,
      handleEditorChange,
    ]
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
