/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse } from 'ndjson';
import { Readable } from 'stream';
import { IFileProcessor, IngestOptions, ParseOptions, ValidationOptions } from '../types';
import { isValidObject } from '../utils/util';
import {
  applyBackpressure,
  BulkIngester,
  BULK_CHUNK_SIZE,
  INVALID_ROW_ERROR_REASON,
  INVALID_ROW_ERROR_TYPE,
  PARSE_ERROR_TYPE,
} from '../utils/bulk_ingest';

export class NDJSONProcessor implements IFileProcessor {
  public async validateText(text: string, _: ValidationOptions) {
    const stringStream = new Readable();
    stringStream._read = () => {};
    stringStream.push(text);
    stringStream.push(null);

    return await new Promise<boolean>((promise, reject) => {
      stringStream
        .pipe(parse({ strict: true }))
        .on('error', (e) => reject(e))
        .on('data', (document: Record<string, any>) => {
          if (!isValidObject(document)) {
            reject(
              new Error(`The following document has empty fields: ${JSON.stringify(document)}`)
            );
          }
        })
        .on('end', () => promise(true));
    });
  }

  public async ingestText(text: string, options: IngestOptions) {
    const { client, indexName, lookupId, lookupField, mapping } = options;
    const stringStream = new Readable();
    stringStream._read = () => {};
    stringStream.push(text);
    stringStream.push(null);

    const ingester = new BulkIngester(client, indexName, BULK_CHUNK_SIZE, mapping);
    const numDocuments = await new Promise<number>((promise) => {
      let numDocumentsCount = 0;

      const parser = stringStream.pipe(parse({ strict: true }));
      parser
        .on('error', (e) => {
          const curRow = ++numDocumentsCount;
          ingester.addFailure(curRow, PARSE_ERROR_TYPE, String(e));
        })
        .on('data', (document: Record<string, any>) => {
          const curRow = ++numDocumentsCount;
          // Inject lookup field if provided
          const doc = lookupId && lookupField ? { ...document, [lookupField]: lookupId } : document;
          applyBackpressure(parser, ingester.add(curRow, doc));
        })
        .on('end', () => {
          promise(numDocumentsCount);
        });
    });

    return await ingester.finish(numDocuments);
  }

  public async ingestFile(file: Readable, options: IngestOptions) {
    const { client, indexName, lookupId, lookupField, mapping } = options;

    const ingester = new BulkIngester(client, indexName, BULK_CHUNK_SIZE, mapping);
    const numDocuments = await new Promise<number>((resolve, reject) => {
      let numDocumentsCount = 0;

      const parser = file.pipe(parse({ strict: true }));
      parser
        .on('error', (e) =>
          reject(new Error(`Stopped processing after ${numDocumentsCount} rows due to: ${e}`))
        )
        .on('data', (document: Record<string, any>) => {
          const curRow = ++numDocumentsCount;
          if (!isValidObject(document)) {
            ingester.addFailure(curRow, INVALID_ROW_ERROR_TYPE, INVALID_ROW_ERROR_REASON);
            return;
          }
          // Inject lookup field if provided
          const doc = lookupId && lookupField ? { [lookupField]: lookupId, ...document } : document;
          applyBackpressure(parser, ingester.add(curRow, doc));
        })
        .on('end', () => {
          resolve(numDocumentsCount);
        });
    });

    return await ingester.finish(numDocuments);
  }

  public async parseFile(file: Readable, limit: number, _: ParseOptions) {
    const documents: Array<Record<string, any>> = [];
    await new Promise<void>((resolve, reject) => {
      file
        .pipe(parse({ strict: true }))
        .on('error', (e) => reject(e))
        .on('data', (document: Record<string, any>) => {
          if (!isValidObject(document)) {
            reject(
              new Error(`The following document has empty fields: ${JSON.stringify(document)}`)
            );
          }

          if (documents.length >= limit) {
            resolve();
            file.destroy();
            return;
          }
          documents.push(document);
        })
        .on('end', () => {
          resolve();
        });
    });

    return documents;
  }
}
