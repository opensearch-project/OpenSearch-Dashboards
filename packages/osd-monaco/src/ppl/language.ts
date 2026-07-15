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
import { SerializableLintContext } from './lint/types';
import { diagnosticToMarker, SYNTAX_MARKER_SOURCE } from './lint/diagnostic_to_marker';
import { pplLintCodeActionProvider } from './lint/code_action_provider';
import {
  clearModelFixes,
  clearModelSyntaxFixes,
  MarkerFix,
  markerFixKey,
  setModelFixes,
  setModelSyntaxFixes,
} from './lint/fix_registry';
import { LINT_OWNER, pplLintHoverProvider } from './lint/hover/hover_provider';
import { clearModelHoverFacts, HoverFacts, setModelHoverFacts } from './lint/hover/hover_registry';

const PPL_LANGUAGE_ID = ID;
const OWNER = 'PPL_WORKER';
const LINT_DEBOUNCE_MS = 500;
const lintDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const lintGenerations = new Map<string, number>();
const syntaxGenerations = new Map<string, number>();

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
      } catch {
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
    clearModelSyntaxFixes(model);
    return;
  }

  // Stamp this run so a slower, earlier validation that resolves after a newer
  // one cannot clobber the newer markers. Mirrors the lint path's guard.
  const generation = (syntaxGenerations.get(model.id) ?? 0) + 1;
  syntaxGenerations.set(model.id, generation);

  try {
    const content = model.getValue();

    // Ensure worker is set up before validation - always call setup as it has internal check
    pplWorkerProxyService.setup();

    const validationResult = (await resolvePPLValidationResult(
      model,
      content,
      async (query) => (await pplWorkerProxyService.validate(query)) as PPLValidationResult
    )) as PPLValidationResult;

    // Bail if a newer run started, the model was disposed, its content changed,
    // or it is no longer PPL while we were awaiting — writing now would resurrect
    // stale markers (and a stale command-typo fix range) over fresher state.
    if (
      syntaxGenerations.get(model.id) !== generation ||
      model.isDisposed() ||
      model.getValue() !== content ||
      model.getLanguageId() !== PPL_LANGUAGE_ID
    ) {
      return;
    }

    if (validationResult.errors.length > 0) {
      // A command-typo error carries a structured `fix`; collect those into the
      // syntax-fix side table (keyed by the marker fields Monaco preserves) so
      // the code-action provider can offer a one-click lightbulb. The fix is not
      // hung off the marker because Monaco's MarkerService rebuilds markers from
      // a fixed field list and drops custom properties — same constraint the
      // lint path handles via setModelFixes.
      const syntaxFixes = new Map<string, MarkerFix>();

      // Command-typo suggestion is a UX layer on the syntax channel, toggleable
      // via the same PPL-lint rules uiSetting (id `command-suggestion`). When it
      // is disabled we revert the friendly rewrite: use ANTLR's raw message and
      // drop the quick-fix, leaving the plain syntax error. The feature is also
      // gated on the global PPL-lint capability: when lint is off, no suggestion
      // enhancements fire (the raw syntax error still shows).
      const commandSuggestionEnabled =
        isPPLLintEnabled() && getPPLLintContext(model)?.commandSuggestionEnabled !== false;

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

        // A command-typo error is rewritten + carries a fix + keeps rawMessage.
        // When suggestions are off, fall back to the raw ANTLR message and no fix.
        const isSuppressedSuggestion =
          !commandSuggestionEnabled && error.code === 'UNKNOWN_COMMAND';
        const effectiveMessage = isSuppressedSuggestion
          ? (error.rawMessage ?? error.message)
          : error.message;
        const effectiveFix = isSuppressedSuggestion ? undefined : error.fix;

        const docLink = getPPLDocumentationLink(effectiveMessage);
        const marker: monaco.editor.IMarkerData = {
          severity: monaco.MarkerSeverity.Error,
          message: effectiveMessage,
          startLineNumber: safeStartLine,
          startColumn: safeStartColumn,
          endLineNumber: safeEndLine,
          endColumn: safeEndColumn,
          // Tag the channel so the code-action provider can serve syntax fixes
          // without touching lint markers.
          source: SYNTAX_MARKER_SOURCE,
          // Add error code for better categorization
          code: {
            value: 'View Documentation',
            target: monaco.Uri.parse(docLink.url),
          },
        };

        if (effectiveFix) {
          syntaxFixes.set(markerFixKey(marker), effectiveFix);
        }

        return marker;
      });

      setModelSyntaxFixes(model, syntaxFixes);
      monaco.editor.setModelMarkers(model, OWNER, markers);
    } else {
      // Clear markers and any stale syntax fixes if no errors
      clearModelSyntaxFixes(model);
      monaco.editor.setModelMarkers(model, OWNER, []);
    }
  } catch {
    // Silent error handling - continue without worker-based highlighting
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
    clearModelFixes(model);
    clearModelHoverFacts(model);
    return;
  }

  const content = model.getValue();

  pplWorkerProxyService.setup();

  // The compiled-worker fallback runs in a Web Worker, so the context must be
  // structured-clone-safe: Sets/Maps are flattened and the http client (a
  // function-bearing object) is dropped. The runtime bridge keeps the full context.
  const lintContext = getPPLLintContext(model);
  const workerContext: SerializableLintContext | undefined = lintContext
    ? {
        isCalcite: lintContext.isCalcite,
        fields: lintContext.fields ? Array.from(lintContext.fields) : undefined,
        typeMap: lintContext.typeMap ? Object.fromEntries(lintContext.typeMap) : undefined,
        disabledObjectFields: lintContext.disabledObjectFields
          ? Array.from(lintContext.disabledObjectFields)
          : undefined,
        visibleIndices: lintContext.visibleIndices,
        settings: lintContext.settings,
        overrides: lintContext.overrides,
        dataSourceId: lintContext.dataSourceId,
        dataSourceVersion: lintContext.dataSourceVersion,
        selectedSourcePattern: lintContext.selectedSourcePattern,
        engineType: lintContext.engineType,
      }
    : undefined;

  void resolvePPLLintResult(
    model,
    content,
    async (query) => (await pplWorkerProxyService.lint(query, workerContext)) as LintResult
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
      // Monaco's MarkerService rebuilds each marker from a fixed field list and
      // drops the custom `fix` / `hoverFacts` properties, so they would never
      // reach the code-action or hover providers. Capture each into a side table
      // keyed by the fields the service preserves, then strip them off the marker
      // before handing it over.
      const fixes = new Map<string, MarkerFix>();
      const hoverFacts = new Map<string, HoverFacts>();
      for (const marker of markers) {
        const withExtras = marker as monaco.editor.IMarkerData & {
          fix?: MarkerFix;
          hoverFacts?: HoverFacts;
        };
        const key = markerFixKey(marker);
        if (withExtras.fix) {
          // markerFixKey is range + message; two diagnostics that collide on that
          // key but carry different fixes would silently last-write-wins. Today
          // separate tables + suppressContained prevent it, so this is a latent
          // tripwire that surfaces if a future rule introduces a real collision.
          // The dead branch is eliminated from production bundles.
          if (
            process.env.NODE_ENV !== 'production' &&
            fixes.has(key) &&
            JSON.stringify(fixes.get(key)) !== JSON.stringify(withExtras.fix)
          ) {
            // eslint-disable-next-line no-console
            console.warn('[ppl-lint] fix key collision:', key);
          }
          fixes.set(key, withExtras.fix);
          delete withExtras.fix;
        }
        if (withExtras.hoverFacts) {
          hoverFacts.set(key, withExtras.hoverFacts);
          delete withExtras.hoverFacts;
        }
      }
      setModelFixes(model, fixes);
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

/**
 * Set up PPL document range formatting provider
 */
const setupPPLFormatter = () => {
  monaco.languages.registerDocumentRangeFormattingEditProvider(
    PPL_LANGUAGE_ID,
    pplRangeFormatProvider
  );
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
          scheduleLintHighlighting(model);
        }
      })
    );

    // Set up language change listener
    disposables.push(
      model.onDidChangeLanguage(async () => {
        if (model.getLanguageId() === PPL_LANGUAGE_ID) {
          await processSyntaxHighlighting(model);
          processLintHighlighting(model);
        } else {
          monaco.editor.setModelMarkers(model, OWNER, []);
          monaco.editor.setModelMarkers(model, LINT_OWNER, []);
          clearModelFixes(model);
          clearModelSyntaxFixes(model);
          clearModelHoverFacts(model);
        }
      })
    );

    // Process immediately if already PPL
    if (model.getLanguageId() === PPL_LANGUAGE_ID) {
      processSyntaxHighlighting(model);
      processLintHighlighting(model);
    }
  };

  // Listen for new models
  disposables.push(monaco.editor.onDidCreateModel(handleModel));

  // Listen for model disposal to clear markers
  disposables.push(
    monaco.editor.onWillDisposeModel((model) => {
      const pending = lintDebounceTimers.get(model.id);
      if (pending !== undefined) {
        clearTimeout(pending);
        lintDebounceTimers.delete(model.id);
      }
      lintGenerations.delete(model.id);
      syntaxGenerations.delete(model.id);
      monaco.editor.setModelMarkers(model, OWNER, []);
      monaco.editor.setModelMarkers(model, LINT_OWNER, []);
      clearModelFixes(model);
      clearModelSyntaxFixes(model);
      clearModelHoverFacts(model);
    })
  );

  // Handle existing models
  monaco.editor.getModels().forEach(handleModel);

  // Return cleanup function
  return () => {
    lintDebounceTimers.forEach(clearTimeout);
    lintDebounceTimers.clear();
    lintGenerations.clear();
    syntaxGenerations.clear();
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

  // Register the lint quick-fix code-action provider (the lightbulb). It reads
  // the fix side tables for both the lint and syntax marker channels.
  const codeActionDisposable = monaco.languages.registerCodeActionProvider(
    PPL_LANGUAGE_ID,
    pplLintCodeActionProvider
  );

  const hoverDisposable = monaco.languages.registerHoverProvider(
    PPL_LANGUAGE_ID,
    pplLintHoverProvider
  );

  return {
    dispose: () => {
      disposeSyntaxHighlighting();
      codeActionDisposable.dispose();
      hoverDisposable.dispose();
    },
  };
};

// Auto-register PPL language support
registerPPLLanguage();
