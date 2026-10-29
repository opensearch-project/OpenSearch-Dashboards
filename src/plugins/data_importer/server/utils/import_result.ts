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
  logger?: { error: (message: string) => void };
}

/**
 * Turns an ingest report into the import routes' response body, pointing the lookup's filtered
 * alias at this import when one was requested. Shared by the file and text import routes.
 *
 * The alias is created whenever ANY rows landed: on partial failure the landed rows already carry
 * the __lookup uuid, and skipping the alias would orphan them on the (possibly shared) index.
 * Alias failures keep the response a 200 (the rows are indexed) but set `aliasError`, so the
 * client fails loudly instead of reporting a lookup that can't be queried.
 */
export const finishImport = async (
  message: IngestResponse,
  { client, indexName, importIdentifier, lookupId, logger }: FinishImportParams
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
      // instead of unioning old and new indices
      await pointLookupAlias(client, {
        indexName,
        alias: importIdentifier,
        lookupId,
        lookupField: LOOKUP_FIELD,
      });
      body.aliasCreated = true;
    } catch (err) {
      body.aliasError = describeAliasError(err);
      logger?.error(`Failed to create alias ${importIdentifier}: ${err}`);
    }
  }
  return body;
};
