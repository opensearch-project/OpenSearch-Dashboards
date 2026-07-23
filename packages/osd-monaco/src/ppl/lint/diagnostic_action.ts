/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';

/**
 * Neutral extension point that lets a feature register additional quick-fix
 * actions for a lint marker without editing the code-action or hover providers.
 *
 * Deterministic catalog quick fixes flow through the fix side table and are
 * handled by the providers directly; this registry is for *contributed* actions
 * (e.g. the AI "Ask Olly to fix" action) that aren't tied to a specific rule's
 * detector. Both providers consult the contributors, so one registration
 * surfaces the action everywhere. Contributors must be pure and fast — they run
 * inside Monaco's synchronous code-action/hover computation.
 */

/** Context a contributor receives for a single marker. */
export interface DiagnosticActionContext {
  /**
   * The marker under consideration. Typed as `IMarkerData` (the base shape) so
   * both the code-action provider (which sees `IMarkerData`) and the hover
   * provider (which sees the richer `IMarker`) can pass their marker directly.
   */
  marker: monaco.editor.IMarkerData;
  /** The catalog rule id for the marker, when resolvable from its `code`. */
  ruleId?: string;
  /** Whether the rule's catalog entry is marked `aiFixable`. */
  aiFixable?: boolean;
  /** Whether the rule requires an explain pass (`needsExplain`). */
  needsExplain?: boolean;
  /** The model the marker belongs to. */
  model: monaco.editor.ITextModel;
}

/** A contributed action. Mirrors the fields the providers need to render it. */
export interface DiagnosticAction {
  /** Lightbulb menu title. */
  title: string;
  /** Command id to run when the action is chosen. */
  commandId: string;
  /** Arguments passed to the command. */
  args?: unknown[];
}

export type PPLDiagnosticActionContributor = (
  context: DiagnosticActionContext
) => DiagnosticAction[];

interface ContributorState {
  contributors: Set<PPLDiagnosticActionContributor>;
}

const PPL_DIAGNOSTIC_ACTION_STATE_KEY = '__osdPPLDiagnosticActionState';

function getContributorState(): ContributorState {
  const globalScope = globalThis as typeof globalThis & {
    [PPL_DIAGNOSTIC_ACTION_STATE_KEY]?: ContributorState;
  };
  if (!globalScope[PPL_DIAGNOSTIC_ACTION_STATE_KEY]) {
    globalScope[PPL_DIAGNOSTIC_ACTION_STATE_KEY] = {
      contributors: new Set<PPLDiagnosticActionContributor>(),
    };
  }
  return globalScope[PPL_DIAGNOSTIC_ACTION_STATE_KEY]!;
}

/** Register a contributor. Returns a disposer that removes exactly this one. */
export function registerPPLDiagnosticActionContributor(
  contributor: PPLDiagnosticActionContributor
): () => void {
  const state = getContributorState();
  state.contributors.add(contributor);
  return () => {
    state.contributors.delete(contributor);
  };
}

/**
 * Collect actions from every registered contributor for one marker. Best-effort:
 * a contributor that throws is skipped so one bad contributor cannot break the
 * lightbulb for the others. Returns an empty array when nothing is contributed.
 */
export function collectPPLDiagnosticActions(context: DiagnosticActionContext): DiagnosticAction[] {
  const { contributors } = getContributorState();
  if (contributors.size === 0) {
    return [];
  }
  const actions: DiagnosticAction[] = [];
  // Snapshot the set so a contributor that (dis)registers during its own run
  // can't perturb this iteration.
  for (const contributor of Array.from(contributors)) {
    try {
      actions.push(...contributor(context));
    } catch {
      // A failing contributor must not disrupt the others.
    }
  }
  return actions;
}
