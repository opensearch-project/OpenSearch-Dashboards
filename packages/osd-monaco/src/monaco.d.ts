/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare module 'monaco-editor/min/vs/editor/editor.main' {
  export * from 'monaco-editor';
}

declare module 'monaco-editor/min/vs/base/browser/ui/codicons/codicon/codicon.css' {
  const content: any;
  export = content;
}

declare module 'monaco-editor/min/vs/language/json/json.worker' {
  const content: any;
  export = content;
}

declare module 'monaco-editor/min/vs/editor/editor.worker' {
  export function initialize(callback: any): void;
}
