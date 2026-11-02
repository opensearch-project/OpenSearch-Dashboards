/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from '../../../../core/server';
import { getErrorStatusCode } from './util';
import { LookupFieldError } from './lookup_field_error';

/** Subfield OpenSearch's dynamic string mapping adds under a `text` field */
const KEYWORD_SUBFIELD = '.keyword';

export interface PointLookupAliasParams {
  /** Concrete index the new import's rows were written to */
  indexName: string;
  /** User-facing lookup name (the import identifier) */
  alias: string;
  /** Per-import uuid stamped on every row of this import */
  lookupId: string;
  /** Field carrying the lookupId on each row (LOOKUP_FIELD) */
  lookupField: string;
  /**
   * Field the alias `term` filter matches on. Defaults to `lookupField`; `ensureLookupField`
   * returns `<lookupField>.keyword` for existing indices that mapped the field as text.
   */
  filterField?: string;
  /**
   * When true and the alias already has an importer-created binding, leave that binding untouched
   * instead of moving it onto this import (used for partial imports). Creating the alias when no
   * previous binding exists is still allowed.
   */
  keepExisting?: boolean;
}

interface AliasBinding {
  index: string;
  /** The binding's alias definition (filter, routing...) as returned by getAlias */
  definition: { filter?: { term?: Record<string, unknown> } } | undefined;
}

/**
 * Returns every index binding of `alias`. A 404 from getAlias means the alias does not exist
 * anywhere yet; every other error is propagated to the caller.
 */
const findAliasBindings = async (
  client: OpenSearchClient,
  alias: string
): Promise<AliasBinding[]> => {
  try {
    const { body } = await client.indices.getAlias({ name: alias });
    // Defensive: only keep entries that really list this alias
    return Object.entries(body ?? {})
      .filter(([, entry]: [string, any]) => entry?.aliases && alias in entry.aliases)
      .map(([index, entry]: [string, any]) => ({ index, definition: entry.aliases[alias] }));
  } catch (e) {
    if (getErrorStatusCode(e) === 404) {
      return [];
    }
    throw e;
  }
};

/**
 * A binding the importer created: its filter is a `term` on the lookup field (or on its `.keyword`
 * subfield, see `ensureLookupField`). Anything else under the same name belongs to someone else.
 */
const isLookupBinding = ({ definition }: AliasBinding, lookupField: string): boolean => {
  const term = definition?.filter?.term;
  return !!term && (lookupField in term || `${lookupField}${KEYWORD_SUBFIELD}` in term);
};

/**
 * Points the lookup's filtered alias at ONLY the rows of the latest import.
 *
 * A plain `add` would leave the alias on any index it already lived on, so re-importing a lookup
 * into a new index made the alias span both indices and queries returned the union of old and new
 * rows. Instead, every existing importer-created binding (including one on the same index, whose
 * filter points at the previous lookupId) is removed and the new binding added in a SINGLE
 * `updateAliases` call. OpenSearch applies the actions atomically, so there is no window where the
 * alias is missing or doubled.
 *
 * The identifier is free text, so it can collide with an alias the importer never created. If ANY
 * binding of the name is not an importer lookup binding, nothing is touched and an error asking the
 * user to choose another name is thrown (surfaced as `aliasError` via `describeAliasError`).
 *
 * Rows from the previous import are left in place (orphaned on that index); cleaning them up is
 * out of scope. Errors (including an alias name that collides with a concrete index) propagate so
 * the route can log them and report `aliasCreated: false`.
 *
 * @returns true when the alias now points at this import; false when `keepExisting` left a previous
 *   binding in place
 */
export const pointLookupAlias = async (
  client: OpenSearchClient,
  {
    indexName,
    alias,
    lookupId,
    lookupField,
    filterField = lookupField,
    keepExisting = false,
  }: PointLookupAliasParams
): Promise<boolean> => {
  const bindings = await findAliasBindings(client, alias);

  if (bindings.some((binding) => !isLookupBinding(binding, lookupField))) {
    throw new Error(
      `The name "${alias}" is already used by an alias not managed by the importer. ` +
        `Choose another import identifier.`
    );
  }

  if (keepExisting && bindings.length > 0) {
    return false;
  }

  await client.indices.updateAliases({
    body: {
      actions: [
        ...bindings.map(({ index }) => ({ remove: { index, alias } })),
        {
          add: {
            index: indexName,
            alias,
            filter: {
              term: {
                [filterField]: lookupId,
              },
            },
          },
        },
      ],
    },
  });
  return true;
};

interface FieldMapping {
  type?: string;
  fields?: Record<string, { type?: string }>;
}

/**
 * Decides which field an alias `term` filter can match exactly for one index's mapping of the
 * lookup field: absent (will be mapped keyword) or keyword => the field itself; text with a
 * keyword subfield (OpenSearch's dynamic string mapping) => the subfield; anything else => error.
 */
const resolveFilterField = (
  index: string,
  lookupField: string,
  mapping: FieldMapping | undefined
): string => {
  if (!mapping || mapping.type === 'keyword') {
    return lookupField;
  }
  if (mapping.type === 'text' && mapping.fields?.keyword?.type === 'keyword') {
    return `${lookupField}${KEYWORD_SUBFIELD}`;
  }
  throw new LookupFieldError(
    `Field "${lookupField}" in index "${index}" is mapped as "${
      mapping.type ?? 'object'
    }", so an import identifier cannot be used to look up rows by exact value. ` +
      `Import without an import identifier, or into a new index.`
  );
};

/**
 * Makes the lookup field usable for the alias `term` filter on an EXISTING index, before any row is
 * written, and returns the field the filter must match on.
 *
 * Create mode maps the lookup field as `keyword`. An existing index never got that mapping, so
 * OpenSearch would map it dynamically as `text` (+ `.keyword`), and a `term` filter on the analyzed
 * text field matches 0 docs, i.e. an empty lookup. So:
 * - field absent on every backing index: add it as `keyword` via put_mapping
 * - already `keyword`: use it as is
 * - `text` with a `keyword` subfield: filter on `<field>.keyword`
 * - anything else, or backing indices that disagree: throw `LookupFieldError`
 *
 * If the mapping cannot be read, put_mapping is still attempted: it succeeds when the field is
 * absent or keyword and rejects a conflicting type, which is reported as a `LookupFieldError`.
 */
export const ensureLookupField = async (
  client: OpenSearchClient,
  indexName: string,
  lookupField: string
): Promise<string> => {
  let lookupMappings: Array<[string, FieldMapping | undefined]> | undefined;
  try {
    const body = (await client.indices.getMapping({ index: indexName })).body as
      Record<string, { mappings?: { properties?: Record<string, FieldMapping> } }> | undefined;
    lookupMappings = Object.entries(body ?? {}).map(([index, entry]) => [
      index,
      entry?.mappings?.properties?.[lookupField],
    ]);
  } catch {
    // Fall through to put_mapping, which validates against the real mapping
  }

  if (lookupMappings && lookupMappings.length > 0) {
    const filterFields = new Set(
      lookupMappings.map(([index, mapping]) => resolveFilterField(index, lookupField, mapping))
    );
    if (filterFields.size > 1) {
      throw new LookupFieldError(
        `Field "${lookupField}" is mapped differently across the indices behind "${indexName}", ` +
          `so an import identifier cannot be used. Import without an import identifier, or into ` +
          `a new index.`
      );
    }
    const [filterField] = filterFields;
    const needsMapping = lookupMappings.some(([, mapping]) => !mapping);
    if (!needsMapping) {
      return filterField;
    }
  }

  try {
    await client.indices.putMapping({
      index: indexName,
      body: { properties: { [lookupField]: { type: 'keyword' } } },
    });
  } catch (e) {
    const status = getErrorStatusCode(e);
    if (status === 403) {
      throw new LookupFieldError(
        `You do not have permission to update the mapping of index "${indexName}" ` +
          `(indices:admin/mapping/put), which is needed to add the "${lookupField}" field used by ` +
          `import identifiers. Import without an import identifier, or into a new index.`,
        403
      );
    }
    if (status === 400) {
      const reason = (e as any)?.meta?.body?.error?.reason ?? (e as Error)?.message;
      throw new LookupFieldError(
        `Field "${lookupField}" in index "${indexName}" cannot be mapped as "keyword" (${reason}). ` +
          `Import without an import identifier, or into a new index.`
      );
    }
    throw e;
  }
  return lookupField;
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
