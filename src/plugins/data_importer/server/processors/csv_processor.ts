/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseStream, parseString } from 'fast-csv';
import { Readable } from 'stream';
import {
  IFileProcessor,
  IngestOptions,
  IngestResponse,
  ParseOptions,
  ValidationOptions,
} from '../types';
import { isValidObject } from '../utils/util';
import {
  applyBackpressure,
  BulkIngester,
  BULK_CHUNK_SIZE,
  INVALID_ROW_ERROR_REASON,
  INVALID_ROW_ERROR_TYPE,
} from '../utils/bulk_ingest';

export class CSVProcessor implements IFileProcessor {
  public async validateText(text: string, options: ValidationOptions) {
    if (!!!options.delimiter) {
      return false;
    }
    return await new Promise<boolean>((resolve, reject) => {
      parseString(text, { headers: true, delimiter: options.delimiter })
        .validate((row: Record<string, any>) => isValidObject(row))
        .on('error', (error) => reject(error))
        .on('data-invalid', (_, rowNumber: number) =>
          reject(new Error(`Row ${rowNumber} is invalid`))
        )
        .on('data', () => {})
        .on('end', () => resolve(true));
    });
  }

  public async ingestText(text: string, options: IngestOptions) {
    const { client, indexName, delimiter, lookupId, lookupField, mapping } = options;

    const ingester = new BulkIngester(client, indexName, BULK_CHUNK_SIZE, mapping);
    return await new Promise<IngestResponse>((resolve, reject) => {
      let totalRows = 0;

      const stream = parseString(text, { headers: true, delimiter });
      stream
        .on('data', (row) => {
          const curRow = ++totalRows;
          // Inject lookup field if provided
          const document = lookupId && lookupField ? { ...row, [lookupField]: lookupId } : row;
          applyBackpressure(stream, ingester.add(curRow, document));
        })
        .on('error', (e) =>
          reject(new Error(`Stopped processing after ${totalRows} rows due to: ${e}`))
        )
        .on('end', (rowCount: number) => {
          ingester.finish(rowCount).then(resolve, reject);
        });
    });
  }

  public async ingestFile(file: Readable, options: IngestOptions) {
    const { client, indexName, delimiter, lookupId, lookupField, mapping } = options;

    if (!!!options.delimiter) {
      throw new Error('Delimiter is required');
    }

    const ingester = new BulkIngester(client, indexName, BULK_CHUNK_SIZE, mapping);
    return await new Promise<IngestResponse>((resolve, reject) => {
      let totalRows = 0;

      const stream = parseStream(file, { headers: true, delimiter });
      stream
        .validate((row: Record<string, any>) => isValidObject(row))
        .on('data', (row) => {
          const curRow = ++totalRows;
          // Inject lookup field if provided
          const document = lookupId && lookupField ? { ...row, [lookupField]: lookupId } : row;
          applyBackpressure(stream, ingester.add(curRow, document));
        })
        .on('data-invalid', (_, rowCount: number) => {
          totalRows++;
          ingester.addFailure(rowCount, INVALID_ROW_ERROR_TYPE, INVALID_ROW_ERROR_REASON);
        })
        .on('error', (e) =>
          reject(new Error(`Stopped processing after ${totalRows} rows due to: ${e}`))
        )
        .on('end', (rowCount: number) => {
          ingester.finish(rowCount).then(resolve, reject);
        });
    });
  }

  public async parseFile(file: Readable, limit: number, options: ParseOptions) {
    const { delimiter } = options;

    if (!!!options.delimiter) {
      throw new Error('Delimiter is required');
    }

    const documents: Array<Record<string, any>> = [];
    await new Promise<void>((resolve, reject) => {
      parseStream(file, { headers: true, delimiter })
        .validate((row: Record<string, any>) => isValidObject(row))
        .on('data', (row) => {
          if (documents.length >= limit) {
            resolve();
            file.destroy();
            return;
          }
          documents.push(row);
        })
        .on('data-invalid', (_, rowNumber: number) =>
          reject(new Error(`Row ${rowNumber} is invalid`))
        )
        .on('error', (error) => reject(error))
        .on('end', () => resolve());
    });

    return documents;
  }
}
