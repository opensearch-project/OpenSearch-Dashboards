/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../monaco';
import { ID, PPL_TOKEN_SETS } from './constants';
import { registerWorker } from '../worker_store';
import { PPLWorkerProxyService } from './worker_proxy_service';
import { getPPLLanguageAnalyzer } from './ppl_language_analyzer';
// @ts-ignore
import { getPPLDocumentationLink } from './ppl_documentation';
// @ts-ignore
import workerSrc from '!!raw-loader!../../target/public/ppl.editor.worker.js';

const PPL_LANGUAGE_ID = ID;
const OWNER = 'PPL_WORKER';

// Register ppl worker to the worker map first
registerWorker(ID, workerSrc);

// PPL worker proxy service for worker-based syntax highlighting
const pplWorkerProxyService = new PPLWorkerProxyService();

// PPL analyzer for synchronous tokenization (lazy initialization)
let pplAnalyzer: ReturnType<typeof getPPLLanguageAnalyzer> | undefined;

/**
 * Map PPL Language Analyzer tokens to Monaco editor token classes
 * Based on ANTLR-generated token types from OpenSearchPPLLexer
 */
const mapPPLTokenToMonacoTokenType = (tokenType: string): string => {
  const type = tokenType.toUpperCase();

  // Use optimized Set lookups from constants
  for (const [monacoType, tokenSet] of Object.entries(PPL_TOKEN_SETS)) {
    if (tokenSet.has(type)) {
      return monacoType;
    }
  }

  // Default case
  return 'identifier';
};

/**
 * Create Monaco language configuration for PPL
 */
const createPPLLanguageConfiguration = (): monaco.languages.LanguageConfiguration => ({
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
});

/**
 * Set up synchronous tokenization for PPL
 */
const setupPPLTokenization = () => {
  monaco.languages.setTokensProvider(PPL_LANGUAGE_ID, {
    getInitialState: () => {
      const state = {
        clone: () => state,
        equals: () => true,
      };
      return state;
    },
    tokenize: (line: string, state: any) => {
      // Use PPL Language Analyzer for accurate tokenization
      const tokens: monaco.languages.IToken[] = [];

      try {
        // Only process if line contains potential PPL content
        if (line.trim()) {
          // Lazy initialize the PPL analyzer only when needed
          if (!pplAnalyzer) {
            pplAnalyzer = getPPLLanguageAnalyzer();
          }

          const pplTokens = pplAnalyzer.tokenize(line);

          for (const pplToken of pplTokens) {
            const tokenType = mapPPLTokenToMonacoTokenType(pplToken.type);
            tokens.push({
              startIndex: pplToken.startIndex,
              scopes: tokenType,
            });
          }
        }
      } catch (error) {
        // If ANTLR fails, return empty tokens
      }

      return {
        tokens,
        endState: state,
      };
    },
  });
};

/**
 * Set up syntax highlighting using PPL worker
 */
const setupPPLSyntaxHighlighting = () => {
  // Set up the worker
  pplWorkerProxyService.setup(workerSrc);

  const allDisposables: monaco.IDisposable[] = [];
  const modelHandlers = new Map<monaco.editor.IModel, monaco.IDisposable[]>();

  const processSyntaxHighlighting = async (model: monaco.editor.IModel) => {
    // Only process if the model is still set to PPL language
    if (model.getLanguageId() !== PPL_LANGUAGE_ID) {
      // Clear any existing PPL markers if language changed
      monaco.editor.setModelMarkers(model, OWNER, []);
      return;
    }

    try {
      const content = model.getValue();

      // Get validation result from worker
      const validationResult = await pplWorkerProxyService.validate(content);

      if (validationResult.errors.length > 0) {
        // Convert errors to Monaco markers
        const markers: monaco.editor.IMarkerData[] = validationResult.errors.map((error) => {
          // Handle different error types with safe property access
          const startLineNumber = (error as any).startLineNumber || (error as any).line || 1;
          const endLineNumber =
            (error as any).endLineNumber || (error as any).endLine || startLineNumber;
          const startColumn = (error as any).startColumn || (error as any).column || 1;
          const endColumn = (error as any).endColumn || startColumn + 1;

          const safeStartLine = Math.max(1, startLineNumber);
          const safeEndLine = Math.max(safeStartLine, endLineNumber);
          const safeStartColumn = Math.max(1, startColumn);
          const safeEndColumn = Math.max(safeStartColumn, endColumn);

          const docLink = getPPLDocumentationLink(error.message);
          return {
            severity: monaco.MarkerSeverity.Error,
            message: error.message,
            startLineNumber: safeStartLine,
            startColumn: safeStartColumn,
            endLineNumber: safeEndLine,
            endColumn: safeEndColumn,
            // Add error code for better categorization
            code: {
              value: 'View Documentation',
              target: monaco.Uri.parse(docLink.url),
            },
          };
        });

        monaco.editor.setModelMarkers(model, OWNER, markers);
      } else {
        // Clear markers if no errors
        monaco.editor.setModelMarkers(model, OWNER, []);
      }
    } catch (error) {
      // Silent error handling - continue without worker-based highlighting
    }
  };

  const addModelHandlers = (model: monaco.editor.IModel) => {
    if (model.getLanguageId() === PPL_LANGUAGE_ID) {
      const disposables: monaco.IDisposable[] = [];

      // Set up content change listener for syntax highlighting
      disposables.push(
        model.onDidChangeContent(async () => {
          await processSyntaxHighlighting(model);
        })
      );

      // Listen to language changes to clean up PPL-specific handling
      disposables.push(
        model.onDidChangeLanguage(() => {
          const currentLanguage = model.getLanguageId();
          if (currentLanguage !== PPL_LANGUAGE_ID) {
            // Language changed away from PPL, clean up
            monaco.editor.setModelMarkers(model, OWNER, []);
            removeModelHandlers(model);
          }
        })
      );

      // Store handlers for this model
      modelHandlers.set(model, disposables);

      // Process initial syntax highlighting
      processSyntaxHighlighting(model);
    }
  };

  const removeModelHandlers = (model: monaco.editor.IModel) => {
    const disposables = modelHandlers.get(model);
    if (disposables) {
      disposables.forEach((d) => d.dispose());
      modelHandlers.delete(model);
    }
  };

  const onModelAdd = (model: monaco.editor.IModel) => {
    addModelHandlers(model);
  };

  const onModelRemove = (model: monaco.editor.IModel) => {
    removeModelHandlers(model);
    // Clear any PPL markers when model is removed
    monaco.editor.setModelMarkers(model, OWNER, []);
  };

  // Handle newly created models
  allDisposables.push(monaco.editor.onDidCreateModel(onModelAdd));

  // Handle model disposal
  allDisposables.push(monaco.editor.onWillDisposeModel(onModelRemove));

  // Handle existing models
  const existingModels = monaco.editor.getModels();
  existingModels.forEach(onModelAdd);

  return () => {
    // Clean up all model handlers
    modelHandlers.forEach((disposables, model) => {
      disposables.forEach((d) => d.dispose());
      monaco.editor.setModelMarkers(model, OWNER, []);
    });
    modelHandlers.clear();

    // Clean up global disposables
    allDisposables.forEach((d) => d.dispose());
    pplWorkerProxyService.stop();
  };
};

/**
 * Register PPL language support with Monaco Editor
 */
export const registerPPLLanguage = () => {
  // Register the PPL language
  monaco.languages.register({
    id: PPL_LANGUAGE_ID,
    extensions: ['.ppl'],
    aliases: ['PPL', 'ppl', 'Piped Processing Language'],
    mimetypes: ['application/ppl', 'text/ppl'],
  });

  // Set language configuration
  monaco.languages.setLanguageConfiguration(PPL_LANGUAGE_ID, createPPLLanguageConfiguration());

  // Set up synchronous tokenization
  setupPPLTokenization();

  // Set up syntax highlighting with worker
  const disposeSyntaxHighlighting = setupPPLSyntaxHighlighting();

  return {
    dispose: () => {
      disposeSyntaxHighlighting();
    },
  };
};

// Auto-register PPL language support
registerPPLLanguage();
