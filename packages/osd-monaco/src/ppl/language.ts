/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../monaco';
import { ID, PPL_TOKEN_SETS } from './constants';
import { registerWorker } from '../worker_store';
import { PPLWorkerProxyService } from './worker_proxy_service';
import { getPPLLanguageAnalyzer, PPLValidationResult } from './ppl_language_analyzer';
import { getPPLDocumentationLink } from './ppl_documentation';
import { pplOnTypeFormatProvider, pplRangeFormatProvider } from './formatter';
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
 * Process syntax highlighting for PPL models
 */
const processSyntaxHighlighting = async (model: monaco.editor.IModel) => {
  // Only process if the model is still set to PPL language
  if (model.getLanguageId() !== PPL_LANGUAGE_ID) {
    // Clear any existing PPL markers if language changed
    monaco.editor.setModelMarkers(model, OWNER, []);
    return;
  }

  try {
    const content = model.getValue();

    // Ensure worker is set up before validation - always call setup as it has internal check
    pplWorkerProxyService.setup(workerSrc);

    // Get validation result from worker with timeout protection
    const validationResult = (await pplWorkerProxyService.validate(content)) as PPLValidationResult;

    if (validationResult.errors.length > 0) {
      // Convert errors to Monaco markers
      const markers: monaco.editor.IMarkerData[] = validationResult.errors.map((error) => {
        // Map SyntaxError properties to Monaco marker properties
        const startLineNumber = error.line || 1;
        const endLineNumber = error.endLine || error.line || startLineNumber;
        const startColumn = (error.column || 0) + 1; // Monaco is 1-based, ANTLR is 0-based
        const endColumn = (error.endColumn || error.column + 1 || startColumn) + 1;

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

/**
 * Set up PPL document range formatting provider
 */
const setupPPLFormatter = () => {
  monaco.languages.registerDocumentRangeFormattingEditProvider(
    PPL_LANGUAGE_ID,
    pplRangeFormatProvider
  );
  monaco.languages.registerOnTypeFormattingEditProvider(PPL_LANGUAGE_ID, pplOnTypeFormatProvider);
};

/**
 * Set up syntax highlighting using PPL worker
 */
const setupPPLSyntaxHighlighting = () => {
  const disposables: monaco.IDisposable[] = [];

  const handleModel = (model: monaco.editor.IModel) => {
    // Set up content change listener
    disposables.push(
      model.onDidChangeContent(async () => {
        if (model.getLanguageId() === PPL_LANGUAGE_ID) {
          await processSyntaxHighlighting(model);
        }
      })
    );

    // Set up language change listener
    disposables.push(
      model.onDidChangeLanguage(async () => {
        if (model.getLanguageId() === PPL_LANGUAGE_ID) {
          await processSyntaxHighlighting(model);
        } else {
          monaco.editor.setModelMarkers(model, OWNER, []);
        }
      })
    );

    // Process immediately if already PPL
    if (model.getLanguageId() === PPL_LANGUAGE_ID) {
      processSyntaxHighlighting(model);
    }
  };

  // Listen for new models
  disposables.push(monaco.editor.onDidCreateModel(handleModel));

  // Listen for model disposal to clear markers
  disposables.push(
    monaco.editor.onWillDisposeModel((model) => {
      monaco.editor.setModelMarkers(model, OWNER, []);
    })
  );

  // Handle existing models
  monaco.editor.getModels().forEach(handleModel);

  // Return cleanup function
  return () => {
    disposables.forEach((d) => d.dispose());
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

  // Set up PPL formatter
  setupPPLFormatter();

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
