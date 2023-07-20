/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

export const workspacesValidator = schema.maybe(
  schema.oneOf([schema.string(), schema.arrayOf(schema.string())])
);

export function formatWorkspaces(workspaces?: string | string[]): string[] | undefined {
  if (Array.isArray(workspaces)) {
    return workspaces;
  }

  if (!workspaces) {
    return undefined;
  }

  return [workspaces];
}
