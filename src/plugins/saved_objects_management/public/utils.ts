/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatWorkspaceIdParams<
  T extends { workspaces?: string[] | null; availableWorkspaces?: string[] | null }
>(obj: T): T | Omit<T, 'workspaces' | 'availableWorkspaces'> {
  const { workspaces, availableWorkspaces, ...others } = obj;
  if (workspaces || (availableWorkspaces && availableWorkspaces.length)) {
    return obj;
  }
  return others;
}
