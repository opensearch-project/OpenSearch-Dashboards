/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseStream, parseString } from 'fast-csv';
import { Readable } from 'stream';
import { IFileProcessor, IngestOptions, ParseOptions, ValidationOptions } from '../types';
import { isValidObject } from '../utils/util';

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
    const { client, indexName, delimiter } = options;

    const failedRows: number[] = [];
    const numDocuments = await new Promise<number>((resolve, reject) => {
      const tasks: Array<Promise<void>> = [];
      let totalRows = 0;

      parseString(text, { headers: true, delimiter })
        .on('data', async (row) => {
          const task = (async () => {
            const curRow = ++totalRows;
            try {
              await client.index({
                index: indexName,
                body: row,
              });
            } catch (_) {
              failedRows.push(curRow);
            }
          })();
          tasks.push(task);
        })
        .on('error', (e) =>
          reject(new Error(`Stopped processing after ${totalRows} rows due to: ${e}`))
        )
        .on('end', async (rowCount: number) => {
          await Promise.all(tasks);
          resolve(rowCount);
        });
    });

    return {
      total: numDocuments,
      message: `Indexed ${numDocuments - failedRows.length} documents`,
      failedRows: failedRows.sort((n1, n2) => n1 - n2),
    };
  }

  public async ingestFile(file: Readable, options: IngestOptions) {
    const { client, indexName, delimiter } = options;

    if (!!!options.delimiter) {
      throw new Error('Delimiter is required');
    }

    const failedRows: number[] = [];
    const numDocuments = await new Promise<number>((resolve, reject) => {
      const tasks: Array<Promise<void>> = [];
      let totalRows = 0;

      parseStream(file, { headers: true, delimiter })
        .validate((row: Record<string, any>) => isValidObject(row))
        .on('data', (row) => {
          const task = (async () => {
            const curRow = ++totalRows;
            try {
              await client.index({
                index: indexName,
                body: row,
              });
            } catch (_) {
              failedRows.push(curRow);
            }
          })();
          tasks.push(task);
        })
        .on('data-invalid', (_, rowCount: number) => {
          totalRows++;
          failedRows.push(rowCount);
        })
        .on('error', (e) =>
          reject(new Error(`Stopped processing after ${totalRows} rows due to: ${e}`))
        )
        .on('end', async (rowCount: number) => {
          await Promise.all(tasks);
          resolve(rowCount);
        });
    });

    return {
      total: numDocuments,
      message: `Indexed ${numDocuments - failedRows.length} documents`,
      failedRows: failedRows.sort((n1, n2) => n1 - n2),
    };
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
