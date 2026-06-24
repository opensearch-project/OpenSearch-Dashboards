/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../monaco';
import { ID, PPL_TOKEN_SETS } from './constants';
import { PPLWorkerProxyService } from './worker_proxy_service';
import { getPPLLanguageAnalyzer, PPLValidationResult } from './ppl_language_analyzer';
import { getPPLDocumentationLink } from './ppl_documentation';
import { pplRangeFormatProvider } from './formatter';
import { resolvePPLValidationResult } from './validation_provider';
import { getPPLLintContext, isPPLLintEnabled, resolvePPLLintResult } from './lint_bridge';
import { LintResult } from './lint/diagnostic';
import { diagnosticToMarker } from './lint/diagnostic_to_marker';
import { LINT_OWNER, pplLintHoverProvider } from './lint/hover/hover_provider';
import {
  clearModelHoverFacts,
  HoverFacts,
  markerFixKey,
  setModelHoverFacts,
} from './lint/hover/hover_registry';

const PPL_LANGUAGE_ID = ID;
const OWNER = 'PPL_WORKER';
const LINT_DEBOUNCE_MS = 500;
const lintDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const lintGenerations = new Map<string, number>();

const pplWorkerProxyService = new PPLWorkerProxyService();

let pplAnalyzer: ReturnType<typeof getPPLLanguageAnalyzer> | undefined;

const mapPPLTokenToMonacoTokenType = (tokenType: string): string => {
  const type = tokenType.toUpperCase();

  for (const [monacoType, tokenSet] of Object.entries(PPL_TOKEN_SETS)) {
    if (tokenSet.has(type)) {
      return monacoType;
    }
  }

  return 'identifier';
};

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
      const tokens: monaco.languages.IToken[] = [];

      try {
        if (line.trim()) {
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
      } catch {
        // best-effort
      }

      return {
        tokens,
        endState: state,
      };
    },
  });
};

const processSyntaxHighlighting = async (model: monaco.editor.IModel) => {
  if (model.getLanguageId() !== PPL_LANGUAGE_ID) {
    monaco.editor.setModelMarkers(model, OWNER, []);
    return;
  }

  try {
    const content = model.getValue();

    pplWorkerProxyService.setup();

    const validationResult = (await resolvePPLValidationResult(
      model,
      content,
      async (query) => (await pplWorkerProxyService.validate(query)) as PPLValidationResult
    )) as PPLValidationResult;

    if (validationResult.errors.length > 0) {
      const markers: monaco.editor.IMarkerData[] = validationResult.errors.map((error) => {
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
          code: {
            value: 'View Documentation',
            target: monaco.Uri.parse(docLink.url),
          },
        };
      });

      monaco.editor.setModelMarkers(model, OWNER, markers);
    } else {
      monaco.editor.setModelMarkers(model, OWNER, []);
    }
  } catch {
    // best-effort
  }
};

export const revalidatePPLModel = async (model: monaco.editor.IModel) => {
  await processSyntaxHighlighting(model);
  processLintHighlighting(model);
};

const processLintHighlighting = (model: monaco.editor.IModel): void => {
  const generation = (lintGenerations.get(model.id) ?? 0) + 1;
  lintGenerations.set(model.id, generation);

  if (!isPPLLintEnabled() || model.getLanguageId() !== PPL_LANGUAGE_ID) {
    monaco.editor.setModelMarkers(model, LINT_OWNER, []);
    clearModelHoverFacts(model);
    return;
  }

  const content = model.getValue();

  pplWorkerProxyService.setup();

  const overrides = getPPLLintContext(model)?.overrides;

  void resolvePPLLintResult(
    model,
    content,
    async (query) => (await pplWorkerProxyService.lint(query, overrides)) as LintResult
  )
    .then((lintResult: LintResult) => {
      if (
        lintGenerations.get(model.id) !== generation ||
        model.isDisposed() ||
        model.getValue() !== content
      ) {
        return;
      }
      if (model.getLanguageId() !== PPL_LANGUAGE_ID) {
        return;
      }
      const markers = lintResult.diagnostics.map(diagnosticToMarker);
      // MarkerService drops custom properties, so extract hoverFacts separately.
      const hoverFacts = new Map<string, HoverFacts>();
      for (const marker of markers) {
        const withExtras = marker as monaco.editor.IMarkerData & {
          hoverFacts?: HoverFacts;
        };
        const key = markerFixKey(marker);
        if (withExtras.hoverFacts) {
          hoverFacts.set(key, withExtras.hoverFacts);
          delete withExtras.hoverFacts;
        }
      }
      setModelHoverFacts(model, hoverFacts);
      monaco.editor.setModelMarkers(model, LINT_OWNER, markers);
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      if (e) console.warn('[ppl-lint] lint pipeline error:', e);
    });
};

const scheduleLintHighlighting = (model: monaco.editor.IModel): void => {
  const existing = lintDebounceTimers.get(model.id);
  if (existing !== undefined) {
    clearTimeout(existing);
  }
  const handle = setTimeout(() => {
    lintDebounceTimers.delete(model.id);
    processLintHighlighting(model);
  }, LINT_DEBOUNCE_MS);
  lintDebounceTimers.set(model.id, handle);
};

const setupPPLFormatter = () => {
  monaco.languages.registerDocumentRangeFormattingEditProvider(
    PPL_LANGUAGE_ID,
    pplRangeFormatProvider
  );
};

const setupPPLSyntaxHighlighting = () => {
  const disposables: monaco.IDisposable[] = [];

  const handleModel = (model: monaco.editor.IModel) => {
    disposables.push(
      model.onDidChangeContent(async () => {
        if (model.getLanguageId() === PPL_LANGUAGE_ID) {
          await processSyntaxHighlighting(model);
          scheduleLintHighlighting(model);
        }
      })
    );

    disposables.push(
      model.onDidChangeLanguage(async () => {
        if (model.getLanguageId() === PPL_LANGUAGE_ID) {
          await processSyntaxHighlighting(model);
          processLintHighlighting(model);
        } else {
          monaco.editor.setModelMarkers(model, OWNER, []);
          monaco.editor.setModelMarkers(model, LINT_OWNER, []);
          clearModelHoverFacts(model);
        }
      })
    );

    if (model.getLanguageId() === PPL_LANGUAGE_ID) {
      processSyntaxHighlighting(model);
      processLintHighlighting(model);
    }
  };

  disposables.push(monaco.editor.onDidCreateModel(handleModel));

  disposables.push(
    monaco.editor.onWillDisposeModel((model) => {
      const pending = lintDebounceTimers.get(model.id);
      if (pending !== undefined) {
        clearTimeout(pending);
        lintDebounceTimers.delete(model.id);
      }
      lintGenerations.delete(model.id);
      monaco.editor.setModelMarkers(model, OWNER, []);
      monaco.editor.setModelMarkers(model, LINT_OWNER, []);
      clearModelHoverFacts(model);
    })
  );

  monaco.editor.getModels().forEach(handleModel);

  return () => {
    lintDebounceTimers.forEach(clearTimeout);
    lintDebounceTimers.clear();
    lintGenerations.clear();
    disposables.forEach((d) => d.dispose());
    pplWorkerProxyService.stop();
  };
};

export const registerPPLLanguage = () => {
  monaco.languages.register({
    id: PPL_LANGUAGE_ID,
    extensions: ['.ppl'],
    aliases: ['PPL', 'ppl', 'Piped Processing Language'],
    mimetypes: ['application/ppl', 'text/ppl'],
  });

  monaco.languages.setLanguageConfiguration(PPL_LANGUAGE_ID, createPPLLanguageConfiguration());

  setupPPLTokenization();

  setupPPLFormatter();

  const disposeSyntaxHighlighting = setupPPLSyntaxHighlighting();

  const hoverDisposable = monaco.languages.registerHoverProvider(
    PPL_LANGUAGE_ID,
    pplLintHoverProvider
  );

  return {
    dispose: () => {
      disposeSyntaxHighlighting();
      hoverDisposable.dispose();
    },
  };
};

registerPPLLanguage();
