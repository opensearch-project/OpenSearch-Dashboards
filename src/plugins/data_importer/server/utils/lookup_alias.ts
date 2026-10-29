/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from '../../../../core/server';
import { getErrorStatusCode } from './util';

export interface PointLookupAliasParams {
  /** Concrete index the new import's rows were written to */
  indexName: string;
  /** User-facing lookup name (the import identifier) */
  alias: string;
  /** Per-import uuid stamped on every row of this import */
  lookupId: string;
  /** Field carrying the lookupId on each row (LOOKUP_FIELD) */
  lookupField: string;
}

/**
 * Returns the indices that currently hold `alias`. A 404 from getAlias means the alias does not
 * exist anywhere yet; every other error is propagated to the caller.
 */
const findAliasIndices = async (client: OpenSearchClient, alias: string): Promise<string[]> => {
  try {
    const { body } = await client.indices.getAlias({ name: alias });
    // Defensive: only keep entries that really list this alias
    return Object.entries(body ?? {})
      .filter(([, entry]: [string, any]) => entry?.aliases && alias in entry.aliases)
      .map(([index]) => index);
  } catch (e) {
    if (getErrorStatusCode(e) === 404) {
      return [];
    }
    throw e;
  }
};

/**
 * Points the lookup's filtered alias at ONLY the rows of the latest import.
 *
 * A plain `add` would leave the alias on any index it already lived on, so re-importing a lookup
 * into a new index made the alias span both indices and queries returned the union of old and new
 * rows. Instead, every existing binding (including one on the same index, whose filter points at
 * the previous lookupId) is removed and the new binding added in a SINGLE `updateAliases` call.
 * OpenSearch applies the actions atomically, so there is no window where the alias is missing or
 * doubled.
 *
 * Rows from the previous import are left in place (orphaned on that index); cleaning them up is
 * out of scope. Errors (including an alias name that collides with a concrete index) propagate so
 * the route can log them and report `aliasCreated: false`.
 */
export const pointLookupAlias = async (
  client: OpenSearchClient,
  { indexName, alias, lookupId, lookupField }: PointLookupAliasParams
): Promise<void> => {
  const existingIndices = await findAliasIndices(client, alias);

  await client.indices.updateAliases({
    body: {
      actions: [
        ...existingIndices.map((index) => ({ remove: { index, alias } })),
        {
          add: {
            index: indexName,
            alias,
            filter: {
              term: {
                [lookupField]: lookupId,
              },
            },
          },
        },
      ],
    },
  });
};

/** Matches the security plugin's "no permissions for [a, b] and User [...]" reason */
const DENIED_ACTIONS_REGEX = /no permissions for \[([^\]]+)\]/;

/**
 * Turns an alias-management failure into a message the user can act on. Permission denials (403)
 * name the exact denied actions when the security plugin reports them and point the user at the
 * alternative that needs no alias permission (importing into an index directly). Other failures
 * surface OpenSearch's reason.
 */
export const describeAliasError = (e: any): string => {
  const reason: string | undefined = e?.meta?.body?.error?.reason;
  if (getErrorStatusCode(e) === 403) {
    const denied = reason?.match(DENIED_ACTIONS_REGEX)?.[1];
    const permissions = denied ? ` (${denied})` : '';
    return `You do not have permission to manage aliases${permissions}. Try creating an index directly.`;
  }
  return reason ?? e?.message ?? String(e);
};
