/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Checks whether a saved object is managed by code (e.g., via osdctl).
 * Returns the managing tool name if managed, or undefined if not.
 */
export function getManagedBy(
  attributes: Record<string, unknown> | undefined
): string | undefined {
  if (!attributes) return undefined;
  const labels = attributes.labels as Record<string, string> | undefined;
  return labels?.['managed-by'] || undefined;
}

/**
 * Returns true if the saved object is managed by any code tool.
 */
export function isManagedObject(
  attributes: Record<string, unknown> | undefined
): boolean {
  return !!getManagedBy(attributes);
}
