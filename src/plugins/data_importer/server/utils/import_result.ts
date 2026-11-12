/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from '../../../../core/server';
import { IngestResponse } from '../types';
import { describeAliasError, pointLookupAlias } from './lookup_alias';
import { LOOKUP_FIELD } from './util';

export interface ImportResultBody {
  message: IngestResponse;
  /** Every row was indexed */
  success: boolean;
  /** Some rows were indexed and some failed; the UI warns with message.errorSummary */
  partial: boolean;
  /** Present only when an import identifier was requested */
  aliasCreated?: boolean;
  /** Present when the alias could not be created; a user-facing explanation */
  aliasError?: string;
}

export interface FinishImportParams {
  client: OpenSearchClient;
  indexName: string;
  /** User-facing lookup name; when absent no alias is managed */
  importIdentifier?: string;
  lookupId?: string;
  /**
   * Field the alias filter matches on (from `ensureLookupField`); defaults to LOOKUP_FIELD.
   * `<LOOKUP_FIELD>.keyword` when an existing index mapped the lookup field as text.
   */
  lookupFilterField?: string;
  logger?: { error: (message: string) => void };
}

/**
 * Turns an ingest report into the import routes' response body, pointing the lookup's filtered
 * alias at this import when one was requested. Shared by the file and text import routes.
 *
 * On a full import the alias is atomically moved onto this import. On a PARTIAL import an existing
 * lookup is left on its previous (complete) import rather than moved onto incomplete data, and
 * `aliasError` says so; if no previous lookup exists the alias is still created, since the landed
 * rows already carry the __lookup uuid and would otherwise be unaddressable. No alias is touched
 * when no rows landed. Alias failures keep the response a 200 (the rows are indexed) but set
 * `aliasError`, so the client fails loudly instead of reporting a lookup that can't be queried.
 */
export const finishImport = async (
  message: IngestResponse,
  {
    client,
    indexName,
    importIdentifier,
    lookupId,
    lookupFilterField = LOOKUP_FIELD,
    logger,
  }: FinishImportParams
): Promise<ImportResultBody> => {
  const indexedCount = message.total - message.failedRows.length;
  const success = message.failedRows.length < 1;
  const partial = indexedCount > 0 && !success;
  const body: ImportResultBody = { message, success, partial };

  if (!importIdentifier || !lookupId) return body;

  body.aliasCreated = false;
  if (indexedCount > 0) {
    try {
      // Atomically moves the alias off any previous import, so a re-import overwrites the lookup
      // instead of unioning old and new indices. A partial import keeps an existing lookup where
      // it is.
      const pointed = await pointLookupAlias(client, {
        indexName,
        alias: importIdentifier,
        lookupId,
        lookupField: LOOKUP_FIELD,
        filterField: lookupFilterField,
        keepExisting: partial,
      });
      if (pointed) {
        body.aliasCreated = true;
      } else {
        body.aliasError =
          `${message.failedRows.length} of ${message.total} rows failed, so lookup ` +
          `'${importIdentifier}' still points at the previous import. Fix the failed rows and ` +
          `re-import to update it.`;
      }
    } catch (err) {
      body.aliasError = describeAliasError(err);
      logger?.error(`Failed to create alias ${importIdentifier}: ${err}`);
    }
  }
  return body;
};
