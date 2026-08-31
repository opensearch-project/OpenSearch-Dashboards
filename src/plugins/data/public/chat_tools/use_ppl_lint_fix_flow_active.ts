/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { isPPLLintFixFlowActive, subscribePPLLintFixOutcome } from './ppl_lint_fix_session';

// Re-renders when a lint-fix flow arms/clears, gating the tool registration to an active
// fix. Timing to verify at runtime: tools register via useEffect (post-commit) but chat
// snapshots tools at send time; onAskAiFix arms before sending.
export function useIsPPLLintFixFlowActive(): boolean {
  const [active, setActive] = useState<boolean>(() => isPPLLintFixFlowActive());

  useEffect(() => {
    const sync = () => setActive(isPPLLintFixFlowActive());
    sync();
    return subscribePPLLintFixOutcome(sync);
  }, []);

  return active;
}
