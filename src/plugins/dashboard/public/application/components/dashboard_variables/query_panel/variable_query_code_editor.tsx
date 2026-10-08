/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { DashboardServices } from '../../../../types';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { DEFAULT_DATA } from '../../../../../../data/common';
import { Dataset } from '../../../../../../data/common';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type IEditorConstructionOptions = monaco.editor.IEditorConstructionOptions;

const queryEditorOptions: IEditorConstructionOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineHeight: 18,
  fontSize: 12,
  cursorStyle: 'line-thin',
  wordWrap: 'on',
  lineDecorationsWidth: 0,
  renderLineHighlight: 'none',
  scrollbar: {
    vertical: 'visible',
    horizontalScrollbarSize: 1,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  lineNumbers: 'on',
  folding: true,
  wrappingIndent: 'same',
  lineNumbersMinChars: 1,
  tabCompletion: 'on',
  renderValidationDecorations: 'off',
  formatOnType: true,
  formatOnPaste: true,
  glyphMargin: false,
  suggest: {
    snippetsPreventQuickSuggestions: false,
    filterGraceful: false,
    showStatusBar: true,
    showWords: false,
  },
};

const languageConfiguration: monaco.languages.LanguageConfiguration = {
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '`', close: '`' },
  ],
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  wordPattern: /@?\w[\w@'.-]*[?!,;:""]*/,
};

const DEFAULT_TRIGGER_CHARACTERS = [' ', '=', "'", '"', '`', '$'];

export interface VariableQueryCodeEditorProps {
  language: string;
  query: string;
  onQueryChange: (query: string) => void;
  /** Current draft dataset — read via a ref internally so the memoized autocomplete provider stays stable. */
  dataset: Dataset | undefined;
  /** Names of other variables in this dashboard, offered as ${name} autocomplete suggestions. */
  existingVariableNames: string[];
  /** Invoked on Ctrl/Cmd+Enter inside the editor — typically runs the Preview query. */
  onRunQuery: () => void;
  data: DashboardServices['data'];
  services: DashboardServices;
}

/**
 * Monaco-backed free-text query editor for PPL/SQL/PromQL variable queries.
 * Owns all Monaco wiring (autocomplete, ${variable} suggestions, Ctrl+Enter
 * to run, content-height auto-resize, focus styling) so QueryEditorModal
 * only needs to render this component and stay focused on the surrounding
 * Query Type / Preview / Apply flow.
 */
export const VariableQueryCodeEditor: React.FC<VariableQueryCodeEditorProps> = ({
  language,
  query,
  onQueryChange,
  dataset,
  existingVariableNames,
  onRunQuery,
  data,
  services,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const disposablesRef = useRef<monaco.IDisposable[]>([]);

  const datasetRef = useRef(dataset);
  const languageRef = useRef(language);
  const variableNamesRef = useRef(existingVariableNames);
  useEffect(() => {
    datasetRef.current = dataset;
  }, [dataset]);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);
  useEffect(() => {
    variableNamesRef.current = existingVariableNames;
  }, [existingVariableNames]);

  const onRunQueryRef = useRef(onRunQuery);
  useEffect(() => {
    onRunQueryRef.current = onRunQuery;
  }, [onRunQuery]);

  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      _context: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.CompletionList> => {
      if (token.isCancellationRequested) {
        return { suggestions: [], incomplete: false };
      }
      try {
        const currentLanguage = languageRef.current;
        const currentDataset = datasetRef.current || data.query.queryString.getQuery().dataset;
        if (!currentDataset) {
          return { suggestions: [], incomplete: false };
        }

        const effectiveLanguage = getEffectiveLanguageForAutoComplete(currentLanguage, 'explore');

        const currentDataView = await data.dataViews.get(
          currentDataset.id,
          currentDataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
        );

        const queryText = model.getValue();
        const offset = model.getOffsetAt(position);
        const servicesWithAppName = { ...services, appName: 'dashboard' };

        const suggestions = await data.autocomplete?.getQuerySuggestions({
          query: queryText,
          selectionStart: offset,
          selectionEnd: offset,
          language: effectiveLanguage,
          baseLanguage: currentLanguage,
          indexPattern: currentDataView ?? currentDataset,
          datasetType: currentDataset?.type,
          position,
          services: servicesWithAppName as any,
        });

        const wordUntil = model.getWordUntilPosition(position);
        const defaultRange = new monaco.Range(
          position.lineNumber,
          wordUntil.startColumn,
          position.lineNumber,
          wordUntil.endColumn
        );

        const filteredSuggestions = suggestions || [];

        const monacoSuggestions: monaco.languages.CompletionItem[] = filteredSuggestions.map(
          (s: any) => ({
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
          })
        );

        const textBeforeCursor = model.getValueInRange(
          new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column)
        );
        const dollarMatch = textBeforeCursor.match(/\$\{?(\w*)$/);
        if (dollarMatch) {
          const fullPrefix = dollarMatch[0];
          const varRange = new monaco.Range(
            position.lineNumber,
            position.column - fullPrefix.length,
            position.lineNumber,
            position.column
          );
          const varNames = variableNamesRef.current || [];
          varNames.forEach((name) => {
            monacoSuggestions.push({
              label: `\${${name}}`,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: `\${${name}}`,
              range: varRange,
              detail: 'Dashboard variable',
              sortText: `!${name}`,
              documentation: {
                value: `Reference variable **${name}** — will be replaced at query time`,
                isTrusted: true,
              },
            });
          });
        }

        return { suggestions: monacoSuggestions, incomplete: false };
      } catch {
        return { suggestions: [], incomplete: false };
      }
    },
    [data, services]
  );

  const provideCompletionItemsRef = useRef(provideCompletionItems);
  useEffect(() => {
    provideCompletionItemsRef.current = provideCompletionItems;
  }, [provideCompletionItems]);

  const suggestionProvider = useMemo(() => {
    const languageTriggerCharacters = data.autocomplete?.getTriggerCharacters?.(language);
    const baseTriggerCharacters = languageTriggerCharacters ?? DEFAULT_TRIGGER_CHARACTERS;
    const triggerCharacters = baseTriggerCharacters.includes('$')
      ? baseTriggerCharacters
      : [...baseTriggerCharacters, '$'];
    return {
      triggerCharacters,
      provideCompletionItems: (
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.CompletionContext,
        token: monaco.CancellationToken
      ) => provideCompletionItemsRef.current(model, position, context, token),
    };
  }, [language, data.autocomplete]);

  const editorDidMount = useCallback((editor: IStandaloneCodeEditor) => {
    editorRef.current = editor;

    const focusDisposable = editor.onDidFocusEditorText(() => setIsFocused(true));
    const blurDisposable = editor.onDidBlurEditorText(() => setIsFocused(false));

    const runQueryActionDisposable = editor.addAction({
      id: 'queryEditorModal.runQuery',
      label: 'Run Query',
      // eslint-disable-next-line no-bitwise
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        onRunQueryRef.current();
      },
    });

    const onDidFocusDisposable = editor.onDidFocusEditorWidget(() => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });

    const contentSizeChangeDisposable = editor.onDidContentSizeChange(() => {
      const contentHeight = editor.getContentHeight();
      const maxHeight = 150;
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

    disposablesRef.current = [
      focusDisposable,
      blurDisposable,
      runQueryActionDisposable,
      onDidFocusDisposable,
      contentSizeChangeDisposable,
    ];
  }, []);

  useEffect(() => {
    return () => {
      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];
    };
  }, []);

  const onEditorClick = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  return (
    <div className="exploreQueryPanel__editorsWrapper">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div
        className={`variableQueryPanelEditor ${isFocused ? 'variableQueryPanelEditor--focused' : ''}`}
        data-test-subj="queryEditorModalEditor"
        onClick={onEditorClick}
      >
        <CodeEditor
          languageId={language}
          languageConfiguration={languageConfiguration}
          value={query}
          onChange={onQueryChange}
          width="100%"
          editorDidMount={editorDidMount}
          suggestionProvider={suggestionProvider}
          options={queryEditorOptions}
          useLatestTheme
          data-test-subj="queryEditorModalCodeEditor"
        />
        {!query && (
          <div className="variableQueryPanelEditor__placeholder">{`Enter ${language} Query...`}</div>
        )}
      </div>
    </div>
  );
};
