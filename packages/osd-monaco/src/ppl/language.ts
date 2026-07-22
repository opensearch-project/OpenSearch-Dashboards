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
import { Diagnostic, LintResult } from './lint/diagnostic';
import { SerializableLintContext } from './lint/types';
import { diagnosticToMarker, SYNTAX_MARKER_SOURCE } from './lint/diagnostic_to_marker';
import { hasExplainRules, runExplainLint } from './lint/explain/run_explain_lint';
import { explainCache } from './lint/explain/explain_cache';
import { resolveExplainRanges } from './lint/explain/resolve_explain_ranges';
import {
  createExplainAttributionState,
  runExplainIsolation,
} from './lint/explain/explain_attribution';
import { validateExplainAttributionSnapshot } from './lint/explain/attribution/snapshot';
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
export const setupPPLTokenization = (languageId: string = PPL_LANGUAGE_ID) => {
  monaco.languages.setTokensProvider(languageId, {
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
      }
    : undefined;

  void resolvePPLLintResult(
    model,
    content,
    async (query) => (await pplWorkerProxyService.lint(query, workerContext)) as LintResult
  )
    .then((lintResult: LintResult) => {
      if (isLintPassStale(model, generation, content)) {
        return;
      }
      // Render the static diagnostics immediately so squiggles never wait on a
      // network round-trip. The explain pass (below) re-renders with its extra
      // diagnostics merged in when it completes.
      renderLintMarkers(model, lintResult.diagnostics);
      layerExplainDiagnostics(
        model,
        content,
        lintContext,
        workerContext,
        generation,
        lintResult.diagnostics
      );
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      if (e) console.warn('[ppl-lint] lint pipeline error:', e);
    });
};

/**
 * True when a lint pass's result should be discarded: the model was superseded
 * by a newer pass, disposed, edited out from under us, or switched languages.
 * Shared by the static render and the async explain re-render so both drop stale
 * results identically.
 */
const isLintPassStale = (
  model: monaco.editor.IModel,
  generation: number,
  content: string
): boolean =>
  lintGenerations.get(model.id) !== generation ||
  model.isDisposed() ||
  model.getValue() !== content ||
  model.getLanguageId() !== PPL_LANGUAGE_ID;

/**
 * Convert diagnostics to Monaco markers and apply them, capturing each
 * diagnostic's `fix` / `hoverFacts` into the side tables the code-action and
 * hover providers read (Monaco's MarkerService rebuilds markers from a fixed
 * field list and would otherwise drop those custom properties).
 */
const renderLintMarkers = (model: monaco.editor.IModel, diagnostics: Diagnostic[]): void => {
  const markers = diagnostics.map(diagnosticToMarker);
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
};

/**
 * Layer the explain-backed diagnostics on top of the already-rendered static
 * markers, narrowed to the offending command. Best-effort and fully async: it
 * issues the `_explain` round-trip only when a Calcite-applicable explain rule
 * is enabled and an http client is present, so a query with no explain rule
 * active pays no network cost. Any failure (no plan, network error, non-Calcite
 * cluster) leaves the static markers untouched.
 *
 * No clean-parse guard is needed: a half-typed or unparseable query makes
 * `_explain` return a non-Calcite / error body, which `toExplainPlan` maps to
 * `{ isCalcite: false }`, and every explain detector no-ops on that — so the
 * round-trip simply yields no diagnostics rather than a wrong one.
 *
 * The explain detectors flag a *whole-query* range. Before rendering, the
 * attribution snapshot (built at parse time by `analyzeLint`) narrows each
 * finding to the specific `where` / `stats` / `sort` command. When the flagged
 * operation has exactly one candidate, that happens with no extra network. When
 * several commands share the operation:
 *  - Fast mode drops the finding (the resolver never emits a wide marker).
 *  - Thorough mode fires bounded control/treatment `_explain` probes to pin the
 *    culprit, then narrows to it.
 * Thorough is the default; the mode rides on the lint context.
 */
const layerExplainDiagnostics = (
  model: monaco.editor.IModel,
  content: string,
  lintContext: ReturnType<typeof getPPLLintContext>,
  workerContext: SerializableLintContext | undefined,
  generation: number,
  staticDiagnostics: Diagnostic[]
): void => {
  const http = lintContext?.http;
  if (
    !http ||
    !hasExplainRules({
      overrides: lintContext?.overrides,
      dataSourceVersion: lintContext?.dataSourceVersion,
      isCalcite: lintContext?.isCalcite,
    })
  ) {
    return;
  }
  const thorough = (lintContext?.explainMode ?? 'thorough') === 'thorough';

  const run = async (): Promise<void> => {
    // Kick off the whole-query plan and the parse-time candidate snapshot
    // together; both describe the same `content`.
    const [resolution, analysis] = await Promise.all([
      explainCache.resolveResult(http, content, lintContext?.dataSourceId),
      pplWorkerProxyService.analyzeLint(content, workerContext),
    ]);
    if (resolution.status !== 'ok' || isLintPassStale(model, generation, content)) {
      return;
    }
    const explainDiagnostics = runExplainLint(resolution.plan, {
      query: content,
      overrides: lintContext?.overrides,
      dataSourceVersion: lintContext?.dataSourceVersion,
      isCalcite: lintContext?.isCalcite,
    });
    if (explainDiagnostics.length === 0) {
      return;
    }

    // The snapshot crosses the worker boundary as plain data; validate it
    // against the current text before it can move a range. Without a usable
    // snapshot there is no provenance to narrow with, so drop the (whole-query)
    // explain findings rather than render them wide.
    const snapshot =
      analysis.attribution && validateExplainAttributionSnapshot(analysis.attribution, content);
    if (!snapshot) {
      return;
    }

    const attributionInputs = {
      query: content,
      snapshot,
      typeMap: lintContext?.typeMap,
      baselineDiagnostics: explainDiagnostics,
      http,
      dataSourceId: lintContext?.dataSourceId,
      validateGeneratedQueries: (queries: string[]) =>
        pplWorkerProxyService.validateLintQueries(queries),
      isCurrent: () => !isLintPassStale(model, generation, content),
    };
    const state = createExplainAttributionState(attributionInputs);

    // Fast, and the shared first pass for Thorough: render the uniquely-sourced
    // findings immediately (fixes withheld until a probe confirms them).
    renderLintMarkers(model, [...staticDiagnostics, ...state.immediateDiagnostics]);

    if (!thorough || !state.needsIsolation || isLintPassStale(model, generation, content)) {
      return;
    }

    // Thorough: disambiguate the remaining ambiguous findings with probes, then
    // re-render with the culprit-narrowed set (which supersedes the immediate
    // one and may add back a probe-confirmed quick fix).
    const isolated = await runExplainIsolation(attributionInputs, state);
    if (isLintPassStale(model, generation, content)) {
      return;
    }
    renderLintMarkers(model, [...staticDiagnostics, ...isolated]);
  };

  void run().catch((e) => {
    // eslint-disable-next-line no-console
    if (e) console.warn('[ppl-lint] explain lint layer error:', e);
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
