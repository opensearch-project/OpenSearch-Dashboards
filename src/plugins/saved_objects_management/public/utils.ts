/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatWorkspaceIdParams<
  T extends { workspaces?: string[] | null; availiableWorkspaces?: string[] | null }
>(obj: T): T | Omit<T, 'workspaces' | 'availiableWorkspaces'> {
  const { workspaces, availiableWorkspaces, ...others } = obj;
  if (workspaces || (availiableWorkspaces && availiableWorkspaces.length)) {
    return obj;
  }
  return others;
}
