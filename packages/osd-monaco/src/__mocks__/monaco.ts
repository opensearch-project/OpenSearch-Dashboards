/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// This is a mock for the Monaco editor to be used in tests
// It provides the minimum functionality needed for tests to run

// Create a mock for the Monaco editor
const monaco = {
  editor: {
    defineTheme: jest.fn(),
    IStandaloneCodeEditor: jest.fn(),
    ITextModel: jest.fn(),
  },
  languages: {
    CompletionItemKind: {
      Class: 1,
      Color: 2,
      Constructor: 3,
      Enum: 4,
      Field: 5,
      File: 6,
      Function: 7,
      Interface: 8,
      Keyword: 9,
      Method: 10,
      Module: 11,
      Property: 12,
      Reference: 13,
      Snippet: 14,
      Text: 15,
      Unit: 16,
      Value: 17,
      Variable: 18,
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
  Position: jest.fn(),
  Range: jest.fn(),
  CancellationToken: jest.fn(),
  IMonarchLanguage: jest.fn(),
};

export { monaco };
