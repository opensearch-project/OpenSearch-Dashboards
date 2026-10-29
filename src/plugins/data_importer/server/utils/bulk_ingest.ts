/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
import { MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import { OpenSearchClient } from '../../../../core/server';
import { IngestErrorSummary, IngestResponse } from '../types';
import { coerceToStringFields, getStringFieldPaths } from './coerce_to_mapping';
import { BulkIndexForbiddenError, getErrorStatusCode } from './util';

/**
 * Number of documents per `_bulk` request. Bounds both request size and in-flight work, replacing
 * the previous one-`index()`-call-per-row fan-out.
 */
export const BULK_CHUNK_SIZE = 1000;

/**
 * Maximum number of distinct failure buckets returned in `errorSummary`
 */
export const MAX_ERROR_SUMMARY_TYPES = 5;

/**
 * Maximum number of example row numbers kept per failure bucket
 */
export const MAX_SAMPLE_ROWS = 5;

/**
 * Error type/reason recorded for rows rejected locally because they failed validation (e.g. empty
 * or malformed field names) and were never sent to OpenSearch
 */
export const INVALID_ROW_ERROR_TYPE = 'invalid_row';
export const INVALID_ROW_ERROR_REASON =
  'Row failed validation: field names must be non-empty and must not start/end with or repeat "."';

/**
 * Error type recorded for documents that could not be parsed (e.g. malformed JSON)
 */
export const PARSE_ERROR_TYPE = 'parse_error';

/**
 * Pause a parser stream while a bulk flush is in flight and resume it afterwards, so a large file
 * is never buffered in memory faster than OpenSearch can accept it.
 */
export const applyBackpressure = (stream: Readable, flush: Promise<void> | undefined) => {
  if (!flush) {
    return;
  }
  stream.pause();
  // Failures are recorded by the ingester itself, so resuming on either outcome is safe
  flush.then(
    () => stream.resume(),
    () => stream.resume()
  );
};

export interface RowFailure {
  row: number;
  type: string;
  reason: string;
}

interface BulkItemResult {
  status?: number;
  error?: { type?: string; reason?: string };
}

interface BulkResponseBody {
  errors?: boolean;
  items?: Array<Record<string, BulkItemResult>>;
}

interface PendingDocument {
  row: number;
  document: Record<string, unknown>;
}

/**
 * Strip per-document detail from an OpenSearch error reason so that rows failing for the same
 * cause land in the same bucket. Field names (in brackets) are kept since they are what the user
 * needs to act on.
 */
export const normalizeErrorReason = (reason: string): string =>
  reason
    .replace(/\s*in document with id '[^']*'/g, '')
    .replace(/\.?\s*Preview of field's value: '.*'$/s, '')
    .trim();

/**
 * Group row failures by error type + normalized reason, most frequent first, capped at
 * MAX_ERROR_SUMMARY_TYPES buckets.
 */
export const summarizeFailures = (failures: RowFailure[]): IngestErrorSummary[] => {
  const buckets = new Map<string, IngestErrorSummary>();
  for (const { row, type, reason } of failures) {
    const normalizedReason = normalizeErrorReason(reason);
    const key = `${type}\u0000${normalizedReason}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { type, reason: normalizedReason, count: 0, sampleRows: [] };
      buckets.set(key, bucket);
    }
    bucket.count++;
    bucket.sampleRows.push(row);
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_ERROR_SUMMARY_TYPES)
    .map((bucket) => ({
      ...bucket,
      sampleRows: bucket.sampleRows.sort((n1, n2) => n1 - n2).slice(0, MAX_SAMPLE_ROWS),
    }));
};

/**
 * Extract a `{type, reason}` pair from an error thrown by the client (e.g. a 403 from the security
 * plugin), falling back to the JS error name/message.
 */
const describeThrownError = (e: unknown): { type: string; reason: string } => {
  const meta = (e as { meta?: { body?: { error?: { type?: unknown; reason?: unknown } } } })?.meta;
  const osError = meta?.body?.error;
  if (osError && typeof osError.type === 'string') {
    return {
      type: osError.type,
      reason: typeof osError.reason === 'string' ? osError.reason : osError.type,
    };
  }
  if (e instanceof Error) {
    return { type: e.name, reason: e.message };
  }
  return { type: 'unknown_error', reason: String(e) };
};

/**
 * Buffers documents and sends them to OpenSearch in sequential, chunked `_bulk` requests, mapping
 * per-item results back to source row numbers.
 *
 * `_bulk` contract (verified live): a partial failure still returns HTTP 200, so the status code is
 * not a signal. The top-level `errors` flag says whether anything failed; each
 * `items[i].<op>.error.{type,reason}` carries the per-document cause. Items are returned in request
 * order, which is how they are mapped back to rows.
 */
export class BulkIngester {
  private buffer: PendingDocument[] = [];
  private readonly failures: RowFailure[] = [];
  /**
   * Chain of flushes; each flush starts only after the previous one completes, so at most one bulk
   * request is ever in flight.
   */
  private inFlight: Promise<void> = Promise.resolve();
  /**
   * Dotted paths the target mapping declares as string types; values there are stringified
   */
  private readonly stringFields: Set<string>;
  /**
   * Set when a bulk request is rejected wholesale for lack of write permission (403). This is a
   * whole-import authorization failure, so once set, `finish()` throws instead of returning a
   * per-row failure report.
   */
  private fatalForbidden: { reason?: string } | undefined;

  /** Rows OpenSearch confirmed as indexed so far (reported if a later chunk is denied) */
  private indexedRows = 0;

  /**
   * @param mapping resolved target index mapping; when given, numbers/booleans bound for
   *   text/keyword fields are sent as strings. Omit to send documents unchanged.
   */
  constructor(
    private readonly client: OpenSearchClient,
    private readonly indexName: string,
    private readonly chunkSize: number = BULK_CHUNK_SIZE,
    mapping?: MappingTypeMapping
  ) {
    this.stringFields = getStringFieldPaths(mapping);
  }

  /**
   * Queue a document. When the buffer reaches the chunk size a flush is scheduled and a promise is
   * returned that resolves once that flush completes, so stream callers can pause until it does to
   * apply backpressure. Returns undefined when no flush was triggered.
   */
  public add(row: number, document: Record<string, unknown>): Promise<void> | undefined {
    this.buffer.push({ row, document: coerceToStringFields(document, this.stringFields) });
    if (this.buffer.length >= this.chunkSize) {
      return this.flush();
    }
    return undefined;
  }

  /**
   * Record a row that was rejected locally (e.g. failed validation) and never sent to OpenSearch
   */
  public addFailure(row: number, type: string, reason: string) {
    this.failures.push({ row, type, reason });
  }

  /**
   * Flush any remaining documents and build the ingest response
   * @param total total number of rows seen in the source, successful or not
   */
  public async finish(total: number): Promise<IngestResponse> {
    await this.flush();
    if (this.fatalForbidden) {
      throw this.buildForbiddenError(this.fatalForbidden.reason, total);
    }
    const failedRows = this.failures.map(({ row }) => row).sort((n1, n2) => n1 - n2);
    return {
      total,
      message: `Indexed ${total - failedRows.length} documents`,
      failedRows,
      errorSummary: summarizeFailures(this.failures),
    };
  }

  private flush(): Promise<void> {
    const chunk = this.buffer;
    this.buffer = [];
    this.inFlight = this.inFlight.then(() => this.sendChunk(chunk));
    return this.inFlight;
  }

  /**
   * Build the single permission error surfaced when the user lacks bulk-write access, whether the
   * 403 arrived as a thrown ResponseError or per-item in the bulk response body. Earlier chunks
   * may already have landed (e.g. permissions changed mid-import); say so rather than implying
   * nothing was written.
   */
  private buildForbiddenError(reason: string | undefined, total: number): BulkIndexForbiddenError {
    return new BulkIndexForbiddenError(
      `You do not have permission to write to index "${this.indexName}". ` +
        `Importing requires the bulk write privilege (for example the ` +
        `"indices:data/write/bulk" action).` +
        (reason ? ` OpenSearch reported: ${reason}` : '') +
        (this.indexedRows > 0
          ? ` ${this.indexedRows} of ${total} rows were indexed into "${this.indexName}" before ` +
            `the permission error and remain there.`
          : '')
    );
  }

  private async sendChunk(chunk: PendingDocument[]) {
    if (chunk.length === 0 || this.fatalForbidden) {
      return;
    }

    const body = chunk.flatMap(({ document }) => [{ index: { _index: this.indexName } }, document]);

    let responseBody: BulkResponseBody;
    try {
      responseBody = (await this.client.bulk({ body })).body as BulkResponseBody;
    } catch (e) {
      // A wholesale 403 (some clusters reject the whole _bulk call rather than per item) means the
      // user lacks bulk-write permission on the index: an authorization failure for the whole
      // import, not a per-document data problem. Record it as fatal so finish() surfaces one
      // actionable permission error instead of "failed to upload" with a bucket per row.
      if (getErrorStatusCode(e) === 403) {
        const { reason } = describeThrownError(e);
        this.fatalForbidden = { reason };
        return;
      }
      // Any other whole-request failure (network, cluster block...): every row in it failed
      const { type, reason } = describeThrownError(e);
      chunk.forEach(({ row }) => this.failures.push({ row, type, reason }));
      return;
    }

    if (!responseBody?.errors) {
      this.indexedRows += chunk.length;
      return;
    }

    const items = responseBody.items ?? [];
    chunk.forEach(({ row }, i) => {
      const item = items[i];
      const result = item ? item[Object.keys(item)[0]] : undefined;
      if (!result) {
        this.failures.push({
          row,
          type: 'missing_bulk_item',
          reason: 'No result returned for this document in the bulk response',
        });
        return;
      }
      if (result.error) {
        // A per-item 403 (the common shape: _bulk returns HTTP 200 with each item carrying a
        // security_exception) is a whole-import authorization failure, not a per-document data
        // problem. Flag it as fatal so finish() surfaces one actionable permission error instead
        // of a failed-document bucket per row.
        if (result.status === 403 && !this.fatalForbidden) {
          this.fatalForbidden = { reason: result.error.reason ?? result.error.type };
        }
        this.failures.push({
          row,
          type: result.error.type ?? 'unknown_error',
          reason: result.error.reason ?? result.error.type ?? 'Unknown error',
        });
        return;
      }
      this.indexedRows++;
    });
  }
}
