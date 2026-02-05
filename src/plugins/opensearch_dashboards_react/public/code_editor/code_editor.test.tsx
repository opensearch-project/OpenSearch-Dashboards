/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { CodeEditor } from './code_editor';
import { monaco } from '@osd/monaco';
import { shallow } from 'enzyme';

// disabled because this is a test, but also it seems we shouldn't need this?
/* eslint-disable-next-line @osd/eslint/module_migration */
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution.js';

// A sample language definition with a few example tokens
const simpleLogLang: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [/\[error.*/, 'constant'],
      [/\[notice.*/, 'variable'],
      [/\[info.*/, 'string'],
      [/\[[a-zA-Z 0-9:]+\]/, 'tag'],
    ],
  },
};

monaco.languages.register({ id: 'loglang' });
monaco.languages.setMonarchTokensProvider('loglang', simpleLogLang);

const logs = `
[Sun Mar 7 20:54:27 2004] [notice] [client xx.xx.xx.xx] This is a notice!
[Sun Mar 7 20:58:27 2004] [info] [client xx.xx.xx.xx] (104)Connection reset by peer: client stopped connection before send body completed
[Sun Mar 7 21:16:17 2004] [error] [client xx.xx.xx.xx] File does not exist: /home/httpd/twiki/view/Main/WebHome
`;

test('is rendered', () => {
  const component = shallow(
    <CodeEditor languageId="loglang" height={250} value={logs} onChange={() => {}} />
  );

  expect(component).toMatchSnapshot();
});

test('editor mount setup', () => {
  const suggestionProvider = {
    provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => ({
      suggestions: [],
    }),
  };
  const signatureProvider = {
    provideSignatureHelp: () =>
      Promise.resolve({
        value: {
          signatures: [],
          activeParameter: 0,
          activeSignature: 0,
        },
        dispose: () => {},
      }),
  };
  const hoverProvider = {
    provideHover: (model: monaco.editor.ITextModel, position: monaco.Position) => ({
      contents: [],
    }),
  };

  const editorWillMount = jest.fn();

  monaco.languages.getLanguages = jest.fn(() => [{ id: 'loglang' }]) as any;
  monaco.languages.registerCompletionItemProvider = jest.fn();
  monaco.languages.registerSignatureHelpProvider = jest.fn();
  monaco.languages.registerHoverProvider = jest.fn();

  monaco.editor.defineTheme = jest.fn();

  const mockSuggestController = {
    widget: {
      value: {
        _setDetailsVisible: jest.fn(),
      },
    },
  };

  const mockEditor = {
    getContribution: jest.fn().mockReturnValue(mockSuggestController),
    onDidFocusEditorWidget: jest.fn(),
    onMouseDown: jest.fn(),
    setPosition: jest.fn(),
    revealPosition: jest.fn(),
    focus: jest.fn(),
  } as any;

  const wrapper = shallow(
    <CodeEditor
      languageId="loglang"
      value={logs}
      onChange={() => {}}
      editorWillMount={editorWillMount}
      suggestionProvider={suggestionProvider}
      signatureProvider={signatureProvider}
      hoverProvider={hoverProvider}
    />
  );

  const instance = wrapper.instance() as CodeEditor;
  instance._editorWillMount(monaco);

  // Verify our mount callback will be called
  expect(editorWillMount.mock.calls.length).toBe(1);

  // Verify our theme will be setup
  expect((monaco.editor.defineTheme as jest.Mock).mock.calls.length).toBe(1);

  // Call editorDidMount to trigger provider registration
  instance._editorDidMount(mockEditor, monaco);

  // Verify our language features have been registered
  expect((monaco.languages.registerCompletionItemProvider as jest.Mock).mock.calls.length).toBe(1);
  expect((monaco.languages.registerSignatureHelpProvider as jest.Mock).mock.calls.length).toBe(1);
  expect((monaco.languages.registerHoverProvider as jest.Mock).mock.calls.length).toBe(1);
});

test('registers providers for new language when languageId prop changes', () => {
  const suggestionProvider = {
    provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => ({
      suggestions: [],
    }),
  };

  monaco.languages.getLanguages = jest.fn(() => [{ id: 'PPL' }, { id: 'kuery' }]) as any;
  monaco.languages.registerCompletionItemProvider = jest.fn();

  monaco.editor.defineTheme = jest.fn();

  const mockSuggestController = {
    widget: {
      value: {
        _setDetailsVisible: jest.fn(),
      },
    },
  };

  const mockEditor = {
    getContribution: jest.fn().mockReturnValue(mockSuggestController),
    onDidFocusEditorWidget: jest.fn(),
    onMouseDown: jest.fn(),
    setPosition: jest.fn(),
    revealPosition: jest.fn(),
    focus: jest.fn(),
  } as any;

  const wrapper = shallow(
    <CodeEditor
      languageId="PPL"
      value={logs}
      onChange={() => {}}
      suggestionProvider={suggestionProvider}
    />
  );

  const instance = wrapper.instance() as CodeEditor;
  instance._editorDidMount(mockEditor, monaco);

  // Provider registered for initial language
  expect((monaco.languages.registerCompletionItemProvider as jest.Mock).mock.calls.length).toBe(1);
  expect((monaco.languages.registerCompletionItemProvider as jest.Mock).mock.calls[0][0]).toBe(
    'PPL'
  );

  // Change language
  wrapper.setProps({ languageId: 'kuery' });

  // Provider should now be registered for the new language too
  expect((monaco.languages.registerCompletionItemProvider as jest.Mock).mock.calls.length).toBe(2);
  expect((monaco.languages.registerCompletionItemProvider as jest.Mock).mock.calls[1][0]).toBe(
    'kuery'
  );
});

test('does not re-register providers when switching back to a previously used language', () => {
  const suggestionProvider = {
    provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => ({
      suggestions: [],
    }),
  };

  monaco.languages.getLanguages = jest.fn(() => [{ id: 'PPL' }, { id: 'kuery' }]) as any;
  monaco.languages.registerCompletionItemProvider = jest.fn();

  monaco.editor.defineTheme = jest.fn();

  const mockSuggestController = {
    widget: {
      value: {
        _setDetailsVisible: jest.fn(),
      },
    },
  };

  const mockEditor = {
    getContribution: jest.fn().mockReturnValue(mockSuggestController),
    onDidFocusEditorWidget: jest.fn(),
    onMouseDown: jest.fn(),
    setPosition: jest.fn(),
    revealPosition: jest.fn(),
    focus: jest.fn(),
  } as any;

  const wrapper = shallow(
    <CodeEditor
      languageId="PPL"
      value={logs}
      onChange={() => {}}
      suggestionProvider={suggestionProvider}
    />
  );

  const instance = wrapper.instance() as CodeEditor;
  instance._editorDidMount(mockEditor, monaco);

  // Initial registration for PPL
  expect((monaco.languages.registerCompletionItemProvider as jest.Mock).mock.calls.length).toBe(1);

  // Switch to kuery
  wrapper.setProps({ languageId: 'kuery' });
  expect((monaco.languages.registerCompletionItemProvider as jest.Mock).mock.calls.length).toBe(2);

  // Switch back to PPL - should NOT register again
  wrapper.setProps({ languageId: 'PPL' });
  expect((monaco.languages.registerCompletionItemProvider as jest.Mock).mock.calls.length).toBe(2);
});

test('skips provider registration for unregistered languages', () => {
  const suggestionProvider = {
    provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => ({
      suggestions: [],
    }),
  };

  // Mock getLanguages to return only PPL (lucene is not registered)
  monaco.languages.getLanguages = jest.fn(() => [{ id: 'PPL' }]) as any;
  monaco.languages.registerCompletionItemProvider = jest.fn();
  monaco.languages.setLanguageConfiguration = jest.fn();

  monaco.editor.defineTheme = jest.fn();

  const mockSuggestController = {
    widget: {
      value: {
        _setDetailsVisible: jest.fn(),
      },
    },
  };

  const mockEditor = {
    getContribution: jest.fn().mockReturnValue(mockSuggestController),
    onDidFocusEditorWidget: jest.fn(),
    onMouseDown: jest.fn(),
    setPosition: jest.fn(),
    revealPosition: jest.fn(),
    focus: jest.fn(),
  } as any;

  const wrapper = shallow(
    <CodeEditor
      languageId="lucene"
      value={logs}
      onChange={() => {}}
      suggestionProvider={suggestionProvider}
    />
  );

  const instance = wrapper.instance() as CodeEditor;
  instance._editorDidMount(mockEditor, monaco);

  // No providers should be registered for unregistered language
  expect((monaco.languages.registerCompletionItemProvider as jest.Mock).mock.calls.length).toBe(0);
});

test('suggest controller details visibility is set on editor mount', () => {
  const mockSuggestController = {
    widget: {
      value: {
        _setDetailsVisible: jest.fn(),
      },
    },
  };

  const mockEditor = {
    getContribution: jest.fn().mockReturnValue(mockSuggestController),
    onDidFocusEditorWidget: jest.fn(),
    onMouseDown: jest.fn(),
    setPosition: jest.fn(),
    revealPosition: jest.fn(),
    focus: jest.fn(),
  } as any;

  const component = shallow(
    <CodeEditor languageId="loglang" height={250} value={logs} onChange={() => {}} />
  );

  const instance = component.instance() as CodeEditor;
  instance._editorDidMount(mockEditor, monaco);

  expect(mockEditor.getContribution).toHaveBeenCalledWith('editor.contrib.suggestController');
  expect(mockSuggestController.widget.value._setDetailsVisible).toHaveBeenCalledWith(true);
});
