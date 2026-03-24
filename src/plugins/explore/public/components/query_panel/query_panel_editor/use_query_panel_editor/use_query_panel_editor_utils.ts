/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';
import { DEFAULT_DATA } from '../../../../../../data/common';

import { ExploreServices } from '../../../../types';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';

import { getCommandEnterAction } from './command_enter_action';
import { getShiftEnterAction } from './shift_enter_action';
import { getTabAction } from './tab_action';
import { getEnterAction } from './enter_action';
import { getSpacebarAction } from './spacebar_action';

import { getEscapeAction } from './escape_action';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { getAutocompleteContext } from '../../../../application/utils/multi_query_utils';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

// TODO: this is a temporary util collection that extracts some shared methods. will remove it
export const getEditorPlaceholder = ({
  isPromptMode,
  promptModeIsAvailable,
  languageTitle,
}: {
  isPromptMode: boolean;
  promptModeIsAvailable: boolean;
  languageTitle: string;
}): string => {
  const enabledPromptPlaceholder = i18n.translate(
    'explore.queryPanel.queryPanelEditor.enabledPromptPlaceholder',
    {
      defaultMessage: 'Press `space` to Ask AI with natural language, or search with {language}',
      values: {
        language: languageTitle,
      },
    }
  );

  const disabledPromptPlaceholder = i18n.translate(
    'explore.queryPanel.queryPanelEditor.disabledPromptPlaceholder',
    {
      defaultMessage: 'Search using {symbol} {language}',
      values: {
        symbol: '</>',
        language: languageTitle,
      },
    }
  );

  const promptModePlaceholder = i18n.translate(
    'explore.queryPanel.queryPanelEditor.promptPlaceholder',
    {
      defaultMessage: 'Ask AI with natural language. `Esc` to clear and search with {language}',
      values: {
        language: languageTitle,
      },
    }
  );

  if (!promptModeIsAvailable) {
    return disabledPromptPlaceholder;
  }

  return isPromptMode ? promptModePlaceholder : enabledPromptPlaceholder;
};

export const editorMount = (
  editor: IStandaloneCodeEditor,
  refs: {
    promptModeIsAvailableRef: React.MutableRefObject<boolean>;
    isPromptModeRef: React.MutableRefObject<boolean>;
    editorTextRef: React.MutableRefObject<string>;
    queryLanguageRef: React.MutableRefObject<string>;
  },
  actions: {
    setEditorRef: (editor: IStandaloneCodeEditor) => void;
    setEditorIsFocused: (value: React.SetStateAction<boolean>) => void;
    handleRun: () => void;
    switchEditorMode: (mode: EditorMode) => void;
    updateDecorations: (
      editor: monaco.editor.IStandaloneCodeEditor | null,
      language: string
    ) => void;
    clearDecorations: (editor: monaco.editor.IStandaloneCodeEditor | null) => void;
  }
) => {
  actions.setEditorRef(editor);

  const focusDisposable = editor.onDidFocusEditorText(() => {
    actions.setEditorIsFocused(true);
  });
  const blurDisposable = editor.onDidBlurEditorText(() => {
    actions.setEditorIsFocused(false);
  });

  editor.addAction(getCommandEnterAction(actions.handleRun));
  editor.addAction(getShiftEnterAction());

  // Add Tab key handling to trigger next autosuggestions after selection
  editor.addAction(getTabAction());

  // Add Enter key handling for suggestions
  editor.addAction(getEnterAction(actions.handleRun));

  // Add Space bar key handling to switch to prompt mode
  editor.addAction(
    getSpacebarAction(refs.promptModeIsAvailableRef, refs.isPromptModeRef, refs.editorTextRef, () =>
      actions.switchEditorMode(EditorMode.Prompt)
    )
  );

  // Add Escape key handling to switch to query mode
  editor.addAction(
    getEscapeAction(refs.isPromptModeRef, () => actions.switchEditorMode(EditorMode.Query))
  );

  // Apply multi-query decorations on mount
  actions.updateDecorations(editor, refs.queryLanguageRef.current);

  // Update decorations when content changes
  const contentChangeDisposable = editor.onDidChangeModelContent(() => {
    actions.updateDecorations(editor, refs.queryLanguageRef.current);
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
    actions.clearDecorations(editor);
    return editor;
  };
};

export const buildCompletionItems = async (
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  _: monaco.languages.CompletionContext,
  token: monaco.CancellationToken,
  params: {
    isPromptModeRef: React.MutableRefObject<boolean>;
    queryLanguage: string;
    services: ExploreServices;
  }
): Promise<monaco.languages.CompletionList> => {
  const {
    dataViews,
    query: { queryString },
  } = params.services.data;
  if (token.isCancellationRequested) {
    return { suggestions: [], incomplete: false };
  }
  try {
    // Get the effective language for autocomplete (PPL -> PPL_Simplified for explore app)
    const effectiveLanguage = getEffectiveLanguageForAutoComplete(
      params.isPromptModeRef.current ? 'AI' : params.queryLanguage,
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
      params.queryLanguage
    );

    // Use the current Dataset to avoid stale data
    const suggestions = await params.services?.data?.autocomplete?.getQuerySuggestions({
      query: autocompleteCtx.queryText,
      selectionStart: autocompleteCtx.selectionStart,
      selectionEnd: autocompleteCtx.selectionEnd,
      language: effectiveLanguage,
      baseLanguage: params.queryLanguage, // Pass the original language before transformation
      indexPattern: currentDataView,
      datasetType: currentDataset?.type,
      position: new monaco.Position(autocompleteCtx.lineNumber, autocompleteCtx.column),
      services: params.services as any, // ExploreServices storage type incompatible with IDataPluginServices.DataStorage
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
};
