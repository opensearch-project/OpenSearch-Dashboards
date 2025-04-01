/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-env jest */

// Global mock for monaco-editor to fix issues with monaco-editor 0.30.1
//
// In monaco-editor 0.30.1, the initialization pattern changed from the previous version (0.17.0):
// - In 0.17.0, __marked_exports was declared at the top of the file and assigned with
//   __marked_exports = marked; at the end, before exports were defined.
// - In 0.30.1, there's a different initialization pattern using define(factory) where
//   __marked_exports = factory(); is used, but in the Jest test environment, this initialization
//   doesn't happen correctly before the exports are attempted.
//
// This causes the "TypeError: Cannot read properties of undefined (reading 'Parser')" error
// when tests try to access properties on the uninitialized __marked_exports object.
//
// This global mock provides a complete mock implementation of the monaco module to avoid
// the initialization issues in the test environment.
jest.mock('@osd/monaco', () => {
  // Create a mock for the Monaco editor
  const monaco = {
    editor: {
      defineTheme: jest.fn(),
      IStandaloneCodeEditor: jest.fn(),
      ITextModel: jest.fn(),
    },
    languages: {
      CompletionItemKind: {
        Method: 0,
        Function: 1,
        Constructor: 2,
        Field: 3,
        Variable: 4,
        Class: 5,
        Struct: 6,
        Interface: 7,
        Module: 8,
        Property: 9,
        Event: 10,
        Operator: 11,
        Unit: 12,
        Value: 13,
        Constant: 14,
        Enum: 15,
        EnumMember: 16,
        Keyword: 17,
        Text: 18,
        Color: 19,
        File: 20,
        Reference: 21,
        Customcolor: 22,
        Folder: 23,
        TypeParameter: 24,
        User: 25,
        Issue: 26,
        Snippet: 27,
      },
      CompletionItemProvider: jest.fn(),
      SignatureHelpProvider: jest.fn(),
      HoverProvider: jest.fn(),
      LanguageConfiguration: jest.fn(),
      onLanguage: jest.fn(),
      register: jest.fn(),
      registerCompletionItemProvider: jest.fn(),
      registerSignatureHelpProvider: jest.fn(),
      registerHoverProvider: jest.fn(),
      setLanguageConfiguration: jest.fn(),
      setMonarchTokensProvider: jest.fn(),
    },
    KeyCode: {
      Enter: 13,
    },
    KeyMod: {
      CtrlCmd: 2048,
    },
    Position: class {
      lineNumber;
      column;
      constructor(lineNumber, column) {
        this.lineNumber = lineNumber;
        this.column = column;
      }
    },
    Range: jest.fn(),
    CancellationToken: jest.fn(),
    IMonarchLanguage: jest.fn(),
    // Add any other properties needed by your tests
  };

  return { monaco };
});
