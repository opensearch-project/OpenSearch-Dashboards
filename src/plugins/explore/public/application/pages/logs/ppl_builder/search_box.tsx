/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { monaco, setupPPLTokenization } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { analyzeSearchExpression } from './search_completion';
import { getCommandEnterAction } from '../../../../components/query_panel/query_panel_editor/use_query_panel_editor/command_enter_action';

/** Dedicated Monaco language id for the restricted PPL search-expression box. */
export const PPL_SEARCH_LANGUAGE_ID = 'pplSearchExpression';

const LINE_HEIGHT = 18;
const MIN_HEIGHT = 20;
const MAX_HEIGHT = 120;

let languageRegistered = false;
function ensureLanguageRegistered() {
  if (languageRegistered) return;
  languageRegistered = true;
  monaco.languages.register({ id: PPL_SEARCH_LANGUAGE_ID });
  // The search expression is (a subset of) PPL, so reuse the real PPL tokenizer;
  // the shared editor theme ('euiColors') then colors it identically to code
  // mode — fields, strings, keywords, and functions all match.
  setupPPLTokenization(PPL_SEARCH_LANGUAGE_ID);
}

/** Monaco action that (re-)opens the native suggestion widget. */
const TRIGGER_SUGGEST_ACTION = 'editor.action.triggerSuggest';

const RETRIGGER_COMMAND: monaco.languages.CompletionItem['command'] = {
  id: TRIGGER_SUGGEST_ACTION,
  title: 'Suggest',
};

interface SearchBoxProps {
  /** Current search-expression text (the source of truth for the row). */
  value: string;
  /** All dataset field names, for field-name autocomplete. */
  fieldNames: string[];
  /** Fetch value suggestions for a field (lazy). Resolves to display strings. */
  onRequestValues: (field: string) => Promise<string[]>;
  /** Commit the edited search-expression text. */
  onChange: (text: string) => void;
  /** Execute the query (Cmd/Ctrl+Enter), mirroring the code-mode editor. */
  onRun?: () => void;
}

/**
 * Single-line search box for the PPL `search` command's
 * <search-expression>. Reuses the shared Monaco {@link CodeEditor} (the same
 * widget as the code editor) and drives its native suggestion dropdown with a
 * grammar-based analysis ({@link analyzeSearchExpression}) so fields, values,
 * operators, and `AND`/`OR`/`NOT`/`IN` are suggested only where the search
 * grammar permits them. The text is the row's source of truth (parsed into the
 * PPL query upstream).
 */
export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  fieldNames,
  onRequestValues,
  onChange,
  onRun,
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

  // Programmatically open the native suggestion widget. Monaco treats this as a
  // no-op refresh when the widget is already showing, so it is safe to call on
  // every relevant event.
  const triggerSuggest = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    editor.trigger('pplSearchBox', TRIGGER_SUGGEST_ACTION, {});
  }, []);

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      syncHeight(editor);

      editor.onDidContentSizeChange(() => syncHeight(editor));

      // Cmd/Ctrl+Enter runs the query, matching the code-mode editor. Reuses the
      // shared action so the keybinding and suggest-widget-close behavior stay
      // identical; the run itself is delegated to the parent via onRun.
      editor.addAction(getCommandEnterAction(() => onRunRef.current?.()));

      // Keep suggestions available at all times: re-open the widget after any
      // content change (typing, delete/backspace) and after the caret moves by
      // an explicit user action (click, arrow keys). This shows the widget even
      // when there is nothing to complete (it renders "No suggestions.").
      //
      // Both are deferred with a 0ms timer so the re-open runs AFTER Monaco
      // finishes its own handling of the same event. Monaco otherwise cancels
      // the suggest session as part of processing the change (a click cancels on
      // mousedown; a deletion that empties the box cancels it too) — so a
      // synchronous trigger would open the widget only for Monaco to immediately
      // close it. This is why deleting `bytes=` back to empty left no widget.
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
    [triggerSuggest, syncHeight]
  );

  useEffect(() => () => window.clearTimeout(suggestTimerRef.current), []);

  ensureLanguageRegistered();

  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position
    ): Promise<monaco.languages.CompletionList> => {
      const text = model.getValue();
      // Monaco columns are 1-based; our analyzer uses 0-based char offsets.
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
          for (const v of values) {
            // PPL requires string literals to be quoted; only bare numeric and
            // boolean literals may be unquoted. A value like `www.opensearch.org`
            // has no whitespace but is still a string, so an unquoted
            // `host=www.opensearch.org` is invalid PPL — it must be
            // `host='www.opensearch.org'`. Quote everything that isn't a plain
            // number/boolean, using single quotes (PPL's string delimiter) with
            // embedded `'` escaped as `''` — matching `build_ppl`'s `whereValue`
            // and the parser's `unquoteValue`, so builder output stays consistent
            // with the field-sidebar filter path.
            const isNumeric = v.trim() !== '' && v === v.trim() && Number.isFinite(Number(v));
            const isBoolean = v === 'true' || v === 'false';
            const insert = isNumeric || isBoolean ? v : `'${v.replace(/'/g, "''")}'`;
            suggestions.push({
              label: v,
              kind: monaco.languages.CompletionItemKind.Value,
              detail: i18n.translate('explore.pplBuilder.searchBox.valueDetail', {
                defaultMessage: 'Value',
              }),
              insertText: `${insert} `,
              range,
              sortText: `0_${v}`,
              command: RETRIGGER_COMMAND,
            });
          }
        } catch {
          // Value suggestions are best-effort.
        }
      }

      for (const kw of analysis.keywords) {
        const isBoolean = kw === 'AND' || kw === 'OR' || kw === 'NOT' || kw === 'IN';
        // Boolean operators AND/OR/NOT are followed by another expression, so
        // append a trailing space so the user can keep typing without adding
        // one manually. IN is followed by `(...)`, so it is left as-is.
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

  // Monaco has no native placeholder, so overlay hint text when the box is
  // empty (mirrors the code-mode query editor's placeholder treatment). It sits
  // behind the editor and is non-interactive so clicks land on Monaco.
  const placeholder = i18n.translate('explore.pplBuilder.searchBox.placeholder', {
    defaultMessage: 'Search or filter your data — fields and values autosuggest as you type...',
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
        languageId={PPL_SEARCH_LANGUAGE_ID}
        value={value}
        onChange={onChange}
        options={options}
        suggestionProvider={suggestionProvider}
        editorDidMount={handleEditorDidMount}
        triggerSuggestOnFocus
        // CodeEditor registers a single shared Monaco theme ('euiColors') whose
        // suggestion-widget colors depend on this flag. The code-mode query
        // editor mounts with useLatestTheme; without it here the search box
        // would re-register the theme in its default variant (which styles the
        // suggest widget with a grey selected row + light-blue matched text,
        // unreadable against each other). Match code mode so the shared theme
        // stays consistent regardless of mount order.
        useLatestTheme
      />
    </div>
  );
};
