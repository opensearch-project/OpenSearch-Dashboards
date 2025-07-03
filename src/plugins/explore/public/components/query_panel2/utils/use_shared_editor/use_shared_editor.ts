/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { useCallback, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { useDispatch } from 'react-redux';
import {
  onEditorChangeActionCreator,
  onEditorRunActionCreator,
} from '../../../../application/utils/state_management/actions/query_editor';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { UseSharedEditorProps, UseSharedEditorReturnType } from '../types';

type LanguageConfiguration = monaco.languages.LanguageConfiguration;
type CompletionItemProvider = monaco.languages.CompletionItemProvider;
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
};

const defaultProvideCompletionItems: CompletionItemProvider['provideCompletionItems'] = () => ({
  suggestions: [],
});

/**
 * This hook should only be used by useTopEditor and useBottomEditor
 */
export const useSharedEditor = ({
  provideCompletionItems = defaultProvideCompletionItems,
  setEditorRef,
}: UseSharedEditorProps): UseSharedEditorReturnType => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  // TODO: Should Height be moved into redux?
  const [editorHeight, setEditorHeight] = useState(32);

  const suggestionProvider = useMemo<CompletionItemProvider>(() => {
    return {
      triggerCharacters: TRIGGER_CHARACTERS,
      provideCompletionItems,
    };
  }, [provideCompletionItems]);

  const editorDidMount = useCallback(
    (editor: IStandaloneCodeEditor) => {
      setEditorRef(editor);

      editor.addAction({
        // TODO: Does this need unique id?
        id: 'run-on-enter',
        label: i18n.translate('explore.queryPanel.reusableEditor.run', {
          defaultMessage: 'Run',
        }),
        // eslint-disable-next-line no-bitwise
        keybindings: [monaco.KeyMod.CtrlCmd, monaco.KeyCode.Enter],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => {
          // Close autocomplete if open
          editor.trigger('keyboard', 'hideSuggestWidget', {});
          dispatch(onEditorRunActionCreator(services));
        },
      });

      editor.addAction({
        // TODO: Does this need unique id?
        id: 'insert-new-line',
        label: i18n.translate('explore.queryPanel.reusableEditor.insertNewLine', {
          defaultMessage: 'Insert New Line',
        }),
        // eslint-disable-next-line no-bitwise
        keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
        run: (ed) => {
          if (ed.hasTextFocus()) {
            const currentPosition = ed.getPosition();
            if (currentPosition) {
              ed.executeEdits('', [
                {
                  range: new monaco.Range(
                    currentPosition.lineNumber,
                    currentPosition.column,
                    currentPosition.lineNumber,
                    currentPosition.column
                  ),
                  text: '\n',
                  forceMoveMarkers: true,
                },
              ]);
              ed.setPosition({
                lineNumber: currentPosition.lineNumber + 1,
                column: 1,
              });
            }
          }
        },
      });

      // Add Tab key handling to trigger next autosuggestions after selection
      editor.addCommand(monaco.KeyCode.Tab, () => {
        // First accept the selected suggestion
        editor.trigger('keyboard', 'acceptSelectedSuggestion', {});

        // Then retrigger suggestions after a short delay
        setTimeout(() => {
          editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
        }, 100);
      });

      // Add Enter key handling for suggestions
      editor.addCommand(monaco.KeyCode.Enter, () => {
        // Check if suggestion widget is visible by checking for any suggestion context
        const contextKeyService = (editor as any)._contextKeyService;
        const suggestWidgetVisible = contextKeyService?.getContextKeyValue('suggestWidgetVisible');

        if (suggestWidgetVisible) {
          // Accept the selected suggestion and trigger next suggestions
          editor.trigger('keyboard', 'acceptSelectedSuggestion', {});
          setTimeout(() => {
            editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
          }, 100);
        } else {
          dispatch(onEditorRunActionCreator(services));
        }
      });

      editor.onDidContentSizeChange(() => {
        const contentHeight = editor.getContentHeight();
        const maxHeight = 100;
        const finalHeight = Math.min(contentHeight, maxHeight);

        setEditorHeight(finalHeight);

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

      return () => editor;
    },
    [dispatch, services, setEditorRef]
  );

  const onChange = useCallback(
    (text: string) => {
      dispatch(onEditorChangeActionCreator(text));
    },
    [dispatch]
  );

  return {
    height: editorHeight,
    suggestionProvider,
    useLatestTheme: true,
    editorDidMount,
    onChange,
    languageConfiguration,
  };
};
