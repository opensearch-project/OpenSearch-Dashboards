/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';

/** Registry for contributed lint-marker quick-fix actions (e.g. AI "Ask Olly to fix"); contributors run in Monaco's synchronous code-action/hover compute, so keep them pure and fast. */

export interface DiagnosticActionContext {
  /** Base `IMarkerData` so both the code-action and hover providers can pass their marker directly. */
  marker: monaco.editor.IMarkerData;
  ruleId?: string;
  aiFixable?: boolean;
  needsExplain?: boolean;
  model: monaco.editor.ITextModel;
}

export interface DiagnosticAction {
  title: string;
  commandId: string;
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

/** Returns a disposer that removes exactly this contributor. */
export function registerPPLDiagnosticActionContributor(
  contributor: PPLDiagnosticActionContributor
): () => void {
  const state = getContributorState();
  state.contributors.add(contributor);
  return () => {
    state.contributors.delete(contributor);
  };
}

/** Best-effort: a throwing contributor is skipped so it can't break the lightbulb for the others. */
export function collectPPLDiagnosticActions(context: DiagnosticActionContext): DiagnosticAction[] {
  const { contributors } = getContributorState();
  if (contributors.size === 0) {
    return [];
  }
  const actions: DiagnosticAction[] = [];
  // Snapshot so a contributor that (dis)registers during its run can't perturb iteration.
  for (const contributor of Array.from(contributors)) {
    try {
      actions.push(...contributor(context));
    } catch {
      // skip failing contributor
    }
  }
  return actions;
}
