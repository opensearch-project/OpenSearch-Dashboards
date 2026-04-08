/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { monaco } from '@osd/monaco';
import {
  EuiPanel,
  EuiProgress,
  EuiSmallButtonEmpty,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiText,
  EuiSpacer,
  EuiFormRow,
  EuiFieldText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  useOpenSearchDashboards,
  CodeEditor,
} from '../../../../../../opensearch_dashboards_react/public';
import { DashboardServices } from '../../../../types';
import {
  executeQueryForOptions,
  filterOptionsByRegex,
} from '../../../../variables/variable_query_utils';
import { IVariableInterpolationService } from '../../../../variables/variable_interpolation_service';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { DEFAULT_DATA } from '../../../../../../data/common';
import { LanguageToggle } from './language_toggle';
import { DatasetSelectWidget } from './dataset_select_widget';
import './variable_query_panel.scss';

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

export interface VariableQueryPanelProps {
  query: string;
  language: string;
  dataset: any;
  onQueryChange: (query: string) => void;
  onLanguageChange: (language: string) => void;
  onDatasetChange: (dataset: any) => void;
  existingVariableNames?: string[];
  interpolationService?: IVariableInterpolationService;
  /** Regex filter string for preview results */
  regex?: string;
  onRegexChange?: (regex: string) => void;
}

export const VariableQueryPanel: React.FC<VariableQueryPanelProps> = ({
  query,
  language,
  dataset,
  onQueryChange,
  onLanguageChange,
  onDatasetChange,
  existingVariableNames = [],
  interpolationService,
  regex = '',
  onRegexChange,
}) => {
  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { data } = services;

  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewValues, setPreviewValues] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);

  const placeholder = useMemo(() => {
    const lang = language.toUpperCase();
    if (lang === 'PPL') {
      return 'source=logs | dedup service | fields service';
    }
    return `Enter ${language} query...`;
  }, [language]);

  // Keep dataset ref updated to avoid stale closures
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

  // --- Autocomplete (adapted from useQueryPanelEditor.provideCompletionItems) ---
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
        // Use refs to always get the latest values
        const currentLanguage = languageRef.current;
        const currentDataset = datasetRef.current || data.query.queryString.getQuery().dataset;

        const effectiveLanguage = getEffectiveLanguageForAutoComplete(currentLanguage, 'explore');

        let currentDataView;
        if (currentDataset?.id) {
          try {
            currentDataView = await data.dataViews.get(
              currentDataset.id,
              currentDataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
            );
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[VariableQueryPanel] DataView not found for:', currentDataset.id, e);
          }
        }

        const queryText = model.getValue();
        const offset = model.getOffsetAt(position);
        const servicesWithAppName = { ...services, appName: 'dashboard' };

        const suggestions = await data.autocomplete?.getQuerySuggestions({
          query: queryText,
          selectionStart: offset,
          selectionEnd: offset,
          language: effectiveLanguage,
          baseLanguage: currentLanguage,
          indexPattern: currentDataView,
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

        // Inject variable suggestions only when the user types '$' — same UX as Grafana.
        const textBeforeCursor = model.getValueInRange(
          new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column)
        );
        const dollarMatch = textBeforeCursor.match(/\$\{?(\w*)$/);
        if (dollarMatch) {
          const fullPrefix = dollarMatch[0]; // e.g. "$", "$se", "${", "${se"
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
      } catch (e) {
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
    return {
      triggerCharacters: languageTriggerCharacters ?? DEFAULT_TRIGGER_CHARACTERS,
      provideCompletionItems: (
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.CompletionContext,
        token: monaco.CancellationToken
      ) => provideCompletionItemsRef.current(model, position, context, token),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editorDidMount = useCallback((editor: IStandaloneCodeEditor) => {
    editorRef.current = editor;

    const focusDisposable = editor.onDidFocusEditorText(() => setIsFocused(true));
    const blurDisposable = editor.onDidBlurEditorText(() => setIsFocused(false));

    // Cmd/Ctrl+Enter to run query
    editor.addAction({
      id: 'variableQueryPanel.runQuery',
      label: 'Run Query',
      // eslint-disable-next-line no-bitwise
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        handleRunQueryRef.current();
      },
    });

    const onDidFocusDisposable = editor.onDidFocusEditorWidget(() => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });

    editor.onDidContentSizeChange(() => {
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

    return () => {
      focusDisposable.dispose();
      blurDisposable.dispose();
      onDidFocusDisposable.dispose();
      return editor;
    };
  }, []);

  const handleRunQueryRef = useRef<() => void>(() => {});

  const handleRunQuery = useCallback(async () => {
    if (!query.trim()) {
      setPreviewError(
        i18n.translate('dashboard.variableQueryPanel.queryEmpty', {
          defaultMessage: 'Query is empty',
        })
      );
      return;
    }

    setIsLoading(true);
    setPreviewError(null);
    setPreviewValues([]);

    try {
      // Interpolate variable references before executing the preview query
      let queryToExecute = query.trim();
      if (interpolationService && interpolationService.hasVariables(queryToExecute)) {
        queryToExecute = interpolationService.interpolate(queryToExecute, language);
      }

      const options = await executeQueryForOptions(data, {
        query: queryToExecute,
        language,
        dataset: dataset || undefined,
      });

      // Apply regex filter to preview results
      const filteredOptions = filterOptionsByRegex(options, regex);

      setPreviewValues(filteredOptions);
      if (filteredOptions.length === 0) {
        setPreviewError(
          i18n.translate('dashboard.variableQueryPanel.noResults', {
            defaultMessage: 'Query returned no results',
          })
        );
      }
    } catch (err: any) {
      setPreviewError(
        err.message ||
          i18n.translate('dashboard.variableQueryPanel.executionFailed', {
            defaultMessage: 'Failed to execute query',
          })
      );
    } finally {
      setIsLoading(false);
    }
  }, [query, interpolationService, data, language, dataset, regex]);

  // Keep ref updated for use in editorDidMount closure
  useEffect(() => {
    handleRunQueryRef.current = handleRunQuery;
  }, [handleRunQuery]);

  const onEditorClick = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  return (
    <>
      <EuiFormRow
        className="variableQueryPanelFormRow"
        label={i18n.translate('dashboard.variableEditor.queryLabel', {
          defaultMessage: 'Options Query',
        })}
        helpText={i18n.translate('dashboard.variableEditor.queryHelp', {
          defaultMessage: 'Select a dataset, write a query, and run it to preview variable options',
        })}
        fullWidth
      >
        <div>
          <EuiPanel paddingSize="s" borderRadius="none" className="variableQueryPanel">
            <EuiFlexGroup gutterSize="xs" direction="column">
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="none" alignItems="center">
                  <EuiFlexItem grow={false}>
                    <LanguageToggle language={language} onLanguageChange={onLanguageChange} />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <DatasetSelectWidget
                      selectedDataset={dataset}
                      onDatasetChange={onDatasetChange}
                      language={language}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    {isLoading ? (
                      <EuiLoadingSpinner size="m" />
                    ) : (
                      <EuiSmallButtonEmpty
                        onClick={handleRunQuery}
                        data-test-subj="variableQueryPanelRunQuery"
                        flush="right"
                      >
                        {i18n.translate('dashboard.variableQueryPanel.runQuery', {
                          defaultMessage: 'Preview',
                        })}
                      </EuiSmallButtonEmpty>
                    )}
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <div className="exploreQueryPanel__editorsWrapper">
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                  <div
                    className={`variableQueryPanelEditor ${
                      isFocused ? 'variableQueryPanelEditor--focused' : ''
                    }`}
                    data-test-subj="variableQueryPanelEditor"
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
                      data-test-subj="variableQueryPanelCodeEditor"
                    />
                    {!query && (
                      <div className="variableQueryPanelEditor__placeholder">{placeholder}</div>
                    )}
                  </div>
                </div>
              </EuiFlexItem>
              <EuiSpacer size="s" />
            </EuiFlexGroup>

            {isLoading && (
              <EuiProgress
                size="xs"
                color="accent"
                position="absolute"
                data-test-subj="variableQueryPanelIsLoading"
              />
            )}
          </EuiPanel>

          {/* Preview of values */}
        </div>
      </EuiFormRow>
      {/* Regex filter */}
      {onRegexChange && (
        <EuiFormRow
          label={i18n.translate('dashboard.variableQueryPanel.regexLabel', {
            defaultMessage: 'Regex',
          })}
          helpText={i18n.translate('dashboard.variableQueryPanel.regexHelp', {
            defaultMessage: 'Optional regex to filter options. Only matching values are shown.',
          })}
        >
          <EuiFieldText
            value={regex}
            onChange={(e) => onRegexChange(e.target.value)}
            placeholder="/^prod-/"
            data-test-subj="variableEditorRegex"
            compressed
          />
        </EuiFormRow>
      )}
      <EuiFormRow
        label={i18n.translate('dashboard.variableQueryPanel.previewTitle', {
          defaultMessage: 'Preview of values ({count})',
          values: { count: previewValues.length },
        })}
      >
        <>
          {(previewValues.length > 0 || previewError) && (
            <>
              <EuiPanel paddingSize="s" color="subdued" hasBorder={false}>
                {previewError ? (
                  <EuiText size="xs" color="danger">
                    {previewError}
                  </EuiText>
                ) : (
                  <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                    {previewValues.map((val) => (
                      <EuiFlexItem key={val} grow={false}>
                        <EuiBadge color="hollow">{val}</EuiBadge>
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGroup>
                )}
              </EuiPanel>
            </>
          )}
        </>
      </EuiFormRow>
    </>
  );
};
