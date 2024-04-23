/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatWorkspaceIdParams<T extends { workspaces?: string[] | null }>(
  obj: T
): T | Omit<T, 'workspaces'> {
  const { workspaces, ...others } = obj;
  if (workspaces) {
    return obj;
  }
  return others;
}
