/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { monaco, setupPPLTokenization } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { analyzeSearchExpression } from './search_completion';
import { compareValueSuggestions } from './value_suggestion_order';
import { getCommandEnterAction } from '../../../../components/query_panel/query_panel_editor/use_query_panel_editor/command_enter_action';

export const PPL_SEARCH_LANGUAGE_ID = 'pplSearchExpression';
// Monaco's built-in language with no tokens or suggestions, for a language without autocomplete.
const PLAIN_TEXT_LANGUAGE_ID = 'plaintext';

const LINE_HEIGHT = 18;
const MIN_HEIGHT = 20;
const MAX_HEIGHT = 120;

let languageRegistered = false;
function ensureLanguageRegistered() {
  if (languageRegistered) return;
  languageRegistered = true;
  monaco.languages.register({ id: PPL_SEARCH_LANGUAGE_ID });
  setupPPLTokenization(PPL_SEARCH_LANGUAGE_ID);
}

const TRIGGER_SUGGEST_ACTION = 'editor.action.triggerSuggest';

const RETRIGGER_COMMAND: monaco.languages.CompletionItem['command'] = {
  id: TRIGGER_SUGGEST_ACTION,
  title: 'Suggest',
};

interface SearchBoxProps {
  value: string;
  fieldNames: string[];
  onRequestValues: (field: string) => Promise<string[]>;
  onChange: (text: string) => void;
  onRun?: () => void;
  /**
   * PPL search syntax: highlighting, and field, value and keyword suggestions. Off for other
   * languages, whose search box is plain text.
   */
  autocomplete?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  fieldNames,
  onRequestValues,
  onChange,
  onRun,
  autocomplete = true,
}) => {
  const fieldNamesRef = useRef(fieldNames);
  fieldNamesRef.current = fieldNames;
  const onRequestValuesRef = useRef(onRequestValues);
  onRequestValuesRef.current = onRequestValues;
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  const suggestTimerRef = useRef<number | undefined>(undefined);

  const [editorHeight, setEditorHeight] = useState(MIN_HEIGHT);

  const syncHeight = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    const contentHeight = editor.getContentHeight();
    const nextHeight = Math.min(Math.max(contentHeight, MIN_HEIGHT), MAX_HEIGHT);
    setEditorHeight(nextHeight);
    editor.updateOptions({
      scrollbar: { vertical: contentHeight > MAX_HEIGHT ? 'visible' : 'hidden' },
    });
  }, []);

  const triggerSuggest = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    editor.trigger('pplSearchBox', TRIGGER_SUGGEST_ACTION, {});
  }, []);

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      syncHeight(editor);

      editor.onDidContentSizeChange(() => syncHeight(editor));

      editor.addAction(getCommandEnterAction(() => onRunRef.current?.()));

      if (!autocomplete) return;
      const scheduleSuggest = () => {
        window.clearTimeout(suggestTimerRef.current);
        suggestTimerRef.current = window.setTimeout(() => triggerSuggest(editor), 0);
      };
      editor.onDidChangeModelContent(() => {
        scheduleSuggest();
      });
      editor.onDidChangeCursorPosition((e) => {
        const userMove =
          e.reason === monaco.editor.CursorChangeReason.Explicit ||
          e.source === 'mouse' ||
          e.source === 'keyboard';
        if (!userMove) return;
        scheduleSuggest();
      });
    },
    [triggerSuggest, syncHeight, autocomplete]
  );

  useEffect(() => () => window.clearTimeout(suggestTimerRef.current), []);

  ensureLanguageRegistered();

  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position
    ): Promise<monaco.languages.CompletionList> => {
      const text = model.getValue();
      const cursor = position.column - 1;
      const analysis = analyzeSearchExpression(text, cursor);

      const range = new monaco.Range(
        position.lineNumber,
        analysis.replaceStart + 1,
        position.lineNumber,
        analysis.replaceEnd + 1
      );

      const suggestions: monaco.languages.CompletionItem[] = [];

      if (analysis.suggestFields) {
        for (const name of fieldNamesRef.current) {
          suggestions.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: i18n.translate('explore.pplBuilder.searchBox.fieldDetail', {
              defaultMessage: 'Field',
            }),
            insertText: `${name}=`,
            range,
            sortText: `2_${name}`,
            command: RETRIGGER_COMMAND,
          });
        }
      }

      if (analysis.suggestValuesForField) {
        try {
          const values = await onRequestValuesRef.current(analysis.suggestValuesForField);
          const ordered = [...values].sort(compareValueSuggestions(analysis.partial));
          ordered.forEach((v, i) => {
            const isNumeric = v.trim() !== '' && v === v.trim() && Number.isFinite(Number(v));
            const isBoolean = v === 'true' || v === 'false';
            const insert = isNumeric || isBoolean ? v : `"${v.replace(/"/g, '""')}"`;
            suggestions.push({
              label: v,
              kind: monaco.languages.CompletionItemKind.Value,
              detail: i18n.translate('explore.pplBuilder.searchBox.valueDetail', {
                defaultMessage: 'Value',
              }),
              insertText: `${insert} `,
              range,
              sortText: `0_${i.toString().padStart(ordered.length.toString().length, '0')}`,
              command: RETRIGGER_COMMAND,
            });
          });
        } catch {
          // noop
        }
      }

      for (const kw of analysis.keywords) {
        const isBoolean = kw === 'AND' || kw === 'OR' || kw === 'NOT' || kw === 'IN';
        const appendsSpace = kw === 'AND' || kw === 'OR' || kw === 'NOT';
        suggestions.push({
          label: kw,
          kind: isBoolean
            ? monaco.languages.CompletionItemKind.Keyword
            : monaco.languages.CompletionItemKind.Operator,
          detail: isBoolean
            ? i18n.translate('explore.pplBuilder.searchBox.keywordDetail', {
                defaultMessage: 'Keyword',
              })
            : i18n.translate('explore.pplBuilder.searchBox.operatorDetail', {
                defaultMessage: 'Operator',
              }),
          insertText: appendsSpace ? `${kw} ` : kw,
          range,
          sortText: `1_${kw}`,
        });
      }

      return { suggestions };
    },
    []
  );

  const suggestionProvider = useMemo<monaco.languages.CompletionItemProvider>(
    () => ({
      triggerCharacters: [' ', '=', '!', '>', '<', '(', ',', '"', "'"],
      provideCompletionItems,
    }),
    [provideCompletionItems]
  );

  const options = useMemo<monaco.editor.IEditorConstructionOptions>(
    () => ({
      lineNumbers: 'off',
      folding: false,
      glyphMargin: false,
      lineDecorationsWidth: 0,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      wrappingIndent: 'none',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      renderLineHighlight: 'none',
      scrollbar: { vertical: 'hidden', horizontal: 'hidden', horizontalScrollbarSize: 0 },
      fontSize: 12,
      lineHeight: LINE_HEIGHT,
      fixedOverflowWidgets: true,
      suggest: { showWords: false },
    }),
    []
  );

  const placeholder = autocomplete
    ? i18n.translate('explore.pplBuilder.searchBox.placeholder', {
        defaultMessage: 'Search or filter your data — fields and values autosuggest as you type...',
      })
    : i18n.translate('explore.pplBuilder.searchBox.plainPlaceholder', {
        defaultMessage: 'Search your data...',
      });

  return (
    <div className="plqSearchBoxEditor" data-test-subj="pplBuilderSearchBox">
      {value.length === 0 ? (
        <div className="plqSearchBoxEditor__placeholder" aria-hidden="true">
          {placeholder}
        </div>
      ) : null}
      <CodeEditor
        height={editorHeight}
        languageId={autocomplete ? PPL_SEARCH_LANGUAGE_ID : PLAIN_TEXT_LANGUAGE_ID}
        value={value}
        onChange={onChange}
        options={options}
        suggestionProvider={autocomplete ? suggestionProvider : undefined}
        editorDidMount={handleEditorDidMount}
        triggerSuggestOnFocus={autocomplete}
        useLatestTheme
      />
    </div>
  );
};
