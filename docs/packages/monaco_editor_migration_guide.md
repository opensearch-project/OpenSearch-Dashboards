# Monaco Editor Migration Guide

This document provides detailed information about the API changes between monaco-editor 0.17.0 and 0.52.0, and offers guidance for plugin developers who need to adapt to these changes.

## Table of Contents

- [Overview](#overview)
- [For Plugins Using Code Editor Directly](#for-plugins-using-code-editor-directly)
- [For Plugins Extending Code Editor or Using Monaco Editor Directly](#for-plugins-extending-code-editor-or-using-monaco-editor-directly)
- [API Changes from 0.17.0 to 0.30.1](#api-changes-from-0170-to-0301)
- [API Changes from 0.30.1 to 0.52.0](#api-changes-from-0301-to-0520)
- [UI and Styling Changes](#ui-and-styling-changes)
- [Worker Implementation Changes](#worker-implementation-changes)
- [Understanding the Code Editor Component](#understanding-the-code-editor-component)
- [Best Practices](#best-practices)

## Overview

OpenSearch Dashboards has upgraded the monaco-editor dependency from version 0.17.0 to 0.52.0. This upgrade was done in two phases:

1. First to version 0.30.1
2. Then to version 0.52.0

This upgrade includes significant API changes that affect the Code Editor component, which is directly accessible to plugins.

## For Plugins Using Code Editor Directly

If your plugin uses the Code Editor component directly without extending it or directly interacting with monaco-editor APIs, most changes will be transparent to you. However, there are some changes you should be aware of:

### Props That Have Changed

| Prop | Before (0.17.0) | After (0.52.0) | Migration |
|------|----------------|----------------|-----------|
| `options.wordBasedSuggestions` | `wordBasedSuggestions: false` | Not supported | Use `options.suggest.showWords: false` instead |
| `options.suggest` | Not commonly used | New structure for suggestion options | See [Suggestion Options](#suggestion-options) |
| `triggerSuggestOnFocus` | Works as expected | Still works, but behavior is more consistent | No changes needed |

### Suggestion Options

The suggestion configuration has changed significantly. If you were configuring suggestion behavior, update your code as follows:

```typescript
// Before (0.17.0)
<CodeEditor
  options={{
    wordBasedSuggestions: false,
    // Other options...
  }}
/>

// After (0.52.0)
<CodeEditor
  options={{
    suggest: {
      showWords: false,
      snippetsPreventQuickSuggestions: false,
      filterGraceful: false,
      showStatusBar: true,
    },
    // Other options...
  }}
/>
```

### Visual Changes

You'll notice some visual changes in the editor:

1. The suggestion widget has a new appearance using the Codicon icon system
2. The status bar in the suggestion widget now uses Monaco's built-in implementation
3. Icons throughout the editor use the new Codicon font-based system

These changes don't require code modifications but may affect the user experience.

## For Plugins Extending Code Editor or Using Monaco Editor Directly

If your plugin extends the Code Editor component or uses monaco-editor APIs directly, you'll need to make more significant changes:

### Completion Provider Changes

The signature for completion providers has changed:

```typescript
// Before (0.17.0)
provideCompletionItems: (model, position) => {
  // Implementation
}

// After (0.52.0)
provideCompletionItems: (model, position, context, token) => {
  // Implementation with context and cancellation token
}
```

You must update all completion providers to include the `context` and `token` parameters. The `context` parameter provides information about how the completion was triggered, and the `token` parameter allows for cancellation of the completion request.

### Import Path Changes

Import paths for monaco-editor modules have changed to include `/browser/` in their structure:

```typescript
// Before (0.17.0)
import 'monaco-editor/esm/vs/editor/editor.api';

// After (0.52.0)
import 'monaco-editor/esm/vs/editor/browser/editor.api';
```

Update all import paths accordingly.

### Method Name Changes

Several method names have changed:

```typescript
// Before (0.17.0)
model.getModeId()

// After (0.52.0)
model.getLanguageId()
```

### Worker Implementation Changes

If you've implemented custom workers, you'll need to update them significantly:

1. The worker architecture has been redesigned
2. The getWorker function signature has changed:
   ```typescript
   // Before (0.17.0)
   getWorker: (moduleId: string, languageId: string) => worker

   // After (0.52.0)
   getWorker: (workerId: string, label: string) => worker
   ```
3. Language services are now loaded on-demand

See the [Worker Implementation Changes](#worker-implementation-changes) section for more details.

## API Changes from 0.17.0 to 0.30.1

### Editor API Changes

| API | 0.17.0 | 0.30.1 | Notes |
|-----|--------|--------|-------|
| `model.getModeId()` | Available | Removed | Use `model.getLanguageId()` instead |
| `editor.getConfiguration()` | Returns old configuration structure | Returns updated configuration structure | Check properties before accessing |
| `monaco.languages.CompletionItemKind` | Uses old enum values | Uses updated enum values | Use enum values directly instead of hardcoded numbers |

### Completion Provider Changes

```typescript
// 0.17.0
interface CompletionItemProvider {
  provideCompletionItems(model: ITextModel, position: Position): ProviderResult<CompletionList>;
  resolveCompletionItem?(item: CompletionItem): ProviderResult<CompletionItem>;
}

// 0.30.1
interface CompletionItemProvider {
  provideCompletionItems(model: ITextModel, position: Position, context: CompletionContext, token: CancellationToken): ProviderResult<CompletionList>;
  resolveCompletionItem?(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem>;
}
```

### Signature Help Provider Changes

```typescript
// 0.17.0
interface SignatureHelpProvider {
  signatureHelpTriggerCharacters: string[];
  provideSignatureHelp(model: ITextModel, position: Position): ProviderResult<SignatureHelp>;
}

// 0.30.1
interface SignatureHelpProvider {
  signatureHelpTriggerCharacters?: ReadonlyArray<string>;
  signatureHelpRetriggerCharacters?: ReadonlyArray<string>;
  provideSignatureHelp(model: ITextModel, position: Position, token: CancellationToken, context: SignatureHelpContext): ProviderResult<SignatureHelp>;
}
```

## API Changes from 0.30.1 to 0.52.0

### Editor API Changes

| API | 0.30.1 | 0.52.0 | Notes |
|-----|--------|--------|-------|
| Import paths | No `/browser/` segment | Include `/browser/` segment | Update all import paths |
| `monaco.editor.create` | Old options structure | Updated options structure | Check documentation for new options |
| `monaco.editor.createModel` | Old options structure | Updated options structure | Check documentation for new options |

### Worker API Changes

```typescript
// 0.30.1
window.MonacoEnvironment = {
  getWorker: function(moduleId, languageId) {
    return new Worker(/* worker URL */);
  }
};

// 0.52.0
window.MonacoEnvironment = {
  getWorker: function(workerId, label) {
    return new Worker(/* worker URL */);
  }
};
```

## UI and Styling Changes

### Suggestion Widget

The suggestion widget has been completely redesigned:

1. In 0.17.0, a custom CSS-based approach was used for the status bar
2. In 0.52.0, Monaco's built-in status bar is used

If you were customizing the suggestion widget, you'll need to update your CSS selectors and possibly your JavaScript code.

### Icon System

1. In 0.17.0, icons were implemented using image sprites and CSS classes
2. In 0.52.0, the Codicon font-based icon system is used

If you were referencing Monaco's icons, you'll need to update your code to use the new Codicon system.

## Worker Implementation Changes

The worker architecture has been significantly redesigned in monaco-editor 0.52.0:

1. Workers are now identified by a workerId and label instead of moduleId and languageId
2. Language services are loaded on-demand
3. The worker initialization process has changed

If you've implemented custom workers, you'll need to:

1. Update the worker initialization code
2. Update how language services are loaded
3. Implement the new worker interface

Example of updated worker configuration:

```typescript
// Before (0.17.0)
window.MonacoEnvironment = {
  getWorker: function(moduleId, languageId) {
    if (languageId === 'json') {
      return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url));
    }
    return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
  }
};

// After (0.52.0)
window.MonacoEnvironment = {
  getWorker: function(workerId, label) {
    if (label === 'json') {
      return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url));
    }
    // Fallback worker for when monaco-editor requests a worker for a language without a specific implementation
    return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
  }
};
```

## Understanding the Code Editor Component

The Code Editor component is a powerful abstraction layer built on top of the Monaco Editor that simplifies integration while providing access to the most commonly used features. This section explains what the Code Editor is, how to use it in your plugins, and why you should prefer it over direct Monaco Editor usage.

### What is the Code Editor?

The Code Editor is a React component that wraps the Monaco Editor and provides:

1. A simplified API for the most common Monaco Editor features
2. Automatic resizing when the window or container size changes
3. Consistent theming with OpenSearch Dashboards
4. Easy configuration of language features like autocompletion, hover documentation, and function signatures

### How to Use the Code Editor in Your Plugin

To use the Code Editor in your plugin, follow these steps:

1. **Import the component**:
   ```typescript
   import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
   ```

2. **Use it in your React component**:
   ```typescript
   <CodeEditor
     height={100}
     languageId="json" // or any other language ID
     value={yourCodeString}
     onChange={(newValue) => handleChange(newValue)}
     options={{
       minimap: { enabled: false },
       scrollBeyondLastLine: false,
       // Other Monaco Editor options...
     }}
   />
   ```

3. **Add autocompletion support** (optional):
   ```typescript
   <CodeEditor
     // ... other props
     suggestionProvider={{
       triggerCharacters: ['.', ' '],
       provideCompletionItems: async (model, position, context, token) => {
         // Your completion logic here
         return {
           suggestions: [
             // Your suggestions here
           ]
         };
       },
     }}
   />
   ```

4. **Configure language features** (optional):
   ```typescript
   <CodeEditor
     // ... other props
     languageConfiguration={{
       autoClosingPairs: [
         { open: '(', close: ')' },
         { open: '[', close: ']' },
         { open: '{', close: '}' },
         // Other pairs...
       ],
     }}
   />
   ```

### Benefits of Using the Code Editor

There are several advantages to using the Code Editor component instead of directly using Monaco Editor:

1. **Simplified Integration**: The Code Editor handles the complex setup of Monaco Editor for you, including theme configuration and resize handling.

2. **Consistent User Experience**: By using the Code Editor, you ensure that your editor has the same look and feel as other editors throughout OpenSearch Dashboards.

3. **Automatic Resizing**: The Code Editor includes a resize detector that automatically adjusts the editor size when the window or container size changes, which Monaco Editor doesn't do by default.

4. **Easy Access to Common Features**: The Code Editor provides simple props for configuring common features like autocompletion, hover documentation, and function signatures.

5. **Future Compatibility**: When Monaco Editor is upgraded in the future, the Code Editor will be updated to handle any breaking changes, minimizing the impact on your plugin.

6. **Still Flexible**: If you need access to advanced Monaco Editor features, you can still get the editor instance through the `editorDidMount` callback.

## Best Practices

1. **Use the Code Editor Component**: Whenever possible, use the Code Editor component provided by OpenSearch Dashboards rather than directly using monaco-editor. See the [Understanding the Code Editor Component](#understanding-the-code-editor-component) section for details on how to use it and its benefits.

2. **Avoid Direct Dependencies on Monaco APIs**: Given monaco-editor's 0.x.y versioning scheme, its API is not considered stable. Minimize direct dependencies on monaco-editor APIs.

3. **Test Thoroughly**: After updating your plugin, test it thoroughly with the new monaco-editor version to ensure compatibility.

4. **Use Enums Instead of Hardcoded Values**: Use monaco-editor's enum values directly instead of hardcoded numbers or strings, as these may change between versions.

5. **Handle Cancellation**: Implement proper handling of cancellation tokens in your providers to improve performance and responsiveness.

6. **Stay Updated**: Keep an eye on monaco-editor's documentation and release notes for future changes.