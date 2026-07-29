/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  maximum_workspaces: schema.maybe(schema.number()),
  aclEnforceEndpointPatterns: schema.arrayOf(schema.string(), { defaultValue: [] }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;

/**
 * The subset of the workspace config which is exposed to the browser,
 * see `exposeToBrowser` in `server/index.ts`.
 */
export type WorkspacePublicConfig = Pick<ConfigSchema, 'maximum_workspaces'>;
