/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExplainDetector } from './explain_types';
import { operationNotPushedDetector } from './rules/operation_not_pushed';
import { operationPushedAsScriptDetector } from './rules/operation_pushed_as_script';

// A registry parallel to `detector_registry.ts`, but for explain-backed
// detectors (which read a plan, not a parse tree). Kept separate so the
// synchronous tree loop in `lint_runner.ts` and the asynchronous explain pass
// never share a dispatch table or accidentally cross contracts.
const registry = new Map<string, ExplainDetector>();

/**
 * Register an explain detector under a key. Re-registering overwrites (last
 * write wins).
 */
export function registerExplainDetector(key: string, detector: ExplainDetector): void {
  registry.set(key, detector);
}

/**
 * Return the explain detector registered for a key, or undefined when none is.
 */
export function getExplainDetector(key: string): ExplainDetector | undefined {
  return registry.get(key);
}

/**
 * Reset the registry. Test-only helper.
 */
export function resetExplainDetectorRegistry(): void {
  registry.clear();
  registerBuiltInExplainDetectors();
}

/**
 * Register every shipping explain detector, keyed by its catalog `detector` key.
 */
export function registerBuiltInExplainDetectors(): void {
  registerExplainDetector('operation-not-pushed', operationNotPushedDetector);
  registerExplainDetector('operation-pushed-as-script', operationPushedAsScriptDetector);
}

// Register built-ins at module load.
registerBuiltInExplainDetectors();
