/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
import { IFileProcessor, IngestOptions, ParseOptions, ValidationOptions } from '../types';
import { isValidObject } from '../utils/util';
import {
  BulkIngester,
  BULK_CHUNK_SIZE,
  INVALID_ROW_ERROR_REASON,
  INVALID_ROW_ERROR_TYPE,
  PARSE_ERROR_TYPE,
} from '../utils/bulk_ingest';

export class JSONProcessor implements IFileProcessor {
  public async validateText(text: string, _: ValidationOptions) {
    if (text.length < 1) {
      return false;
    }
    try {
      const obj = JSON.parse(text);
      return obj && typeof obj === 'object' && isValidObject(obj);
    } catch {
      return false;
    }
  }

  public async ingestText(text: string, options: IngestOptions) {
    const { client, indexName, lookupId, lookupField, mapping } = options;
    const document = JSON.parse(text);

    // Inject lookup field if provided
    const doc = lookupId && lookupField ? { ...document, [lookupField]: lookupId } : document;

    const ingester = new BulkIngester(client, indexName, BULK_CHUNK_SIZE, mapping);
    await ingester.add(1, doc);
    return await ingester.finish(1);
  }

  public async ingestFile(file: Readable, options: IngestOptions) {
    const { client, indexName, lookupId, lookupField, mapping } = options;

    const ingester = new BulkIngester(client, indexName, BULK_CHUNK_SIZE, mapping);
    await new Promise<void>((resolve) => {
      let rawData = '';
      file
        .on('data', (chunk) => (rawData += chunk))
        .on('error', (e) => {
          ingester.addFailure(1, PARSE_ERROR_TYPE, String(e));
          resolve();
        })
        .on('end', () => {
          let document: Record<string, unknown>;
          try {
            document = JSON.parse(rawData);
          } catch (e) {
            ingester.addFailure(1, PARSE_ERROR_TYPE, e instanceof Error ? e.message : String(e));
            resolve();
            return;
          }
          if (!isValidObject(document)) {
            ingester.addFailure(1, INVALID_ROW_ERROR_TYPE, INVALID_ROW_ERROR_REASON);
            resolve();
            return;
          }

          // Inject lookup field if provided
          const doc = lookupId && lookupField ? { ...document, [lookupField]: lookupId } : document;
          ingester.add(1, doc);
          resolve();
        });
    });

    return await ingester.finish(1);
  }

  public async parseFile(file: Readable, limit: number, _: ParseOptions) {
    const documents: Array<Record<string, any>> = [];
    await new Promise<void>((resolve, reject) => {
      let rawData = '';
      file
        .on('data', (chunk) => (rawData += chunk))
        .on('error', (e) => reject(e))
        .on('end', async () => {
          try {
            const document = JSON.parse(rawData);
            if (!isValidObject(document)) {
              reject(
                new Error(`The following document has empty fields: ${JSON.stringify(document)}`)
              );
            }
            documents.push(document);
          } catch (e) {
            reject(e);
          }
          resolve();
        });
    });

    return documents;
  }
}
