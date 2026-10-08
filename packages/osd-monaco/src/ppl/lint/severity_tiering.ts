/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic, LintSeverity } from './diagnostic';

const SEVERITY_ORDER: LintSeverity[] = ['error', 'warning', 'info'];

export function selectHighestSeverityTier(diagnostics: Diagnostic[]): Diagnostic[] {
  const severity = SEVERITY_ORDER.find((candidate) =>
    diagnostics.some((diagnostic) => diagnostic.severity === candidate)
  );
  return severity ? diagnostics.filter((diagnostic) => diagnostic.severity === severity) : [];
}
