/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseStream, parseString } from 'fast-csv';
import { Readable } from 'stream';
import { IFileParser, IngestOptions, ParseOptions, ValidationOptions } from '../types';

export class CSVParser implements IFileParser {
  public async validateText(text: string, options: ValidationOptions) {
    if (!!!options.delimiter) {
      return false;
    }
    return await new Promise<boolean>((resolve, reject) => {
      parseString(text, { headers: true, delimiter: options.delimiter })
        .validate((row: any) => {
          for (const key in row) {
            if (!!!key) {
              return false;
            }
          }
          return true;
        })
        .on('error', (error) => reject(error))
        .on('data-invalid', () => reject(''))
        .on('data', () => {})
        .on('end', () => resolve(true));
    });
  }

  public async ingestText(text: string, options: IngestOptions) {
    const { client, indexName, delimiter } = options;

    const numDocuments = await new Promise<number>((resolve, reject) => {
      parseString(text, { headers: true, delimiter })
        .on('data', async (row) => {
          try {
            await client.index({
              index: indexName,
              body: row,
            });
          } catch (e) {
            reject(e);
          }
        })
        .on('error', (error) => reject(error))
        .on('end', (rowCount: number) => resolve(rowCount));
    });

    return {
      total: numDocuments,
      message: `Indexed ${numDocuments} documents`,
    };
  }

  public async ingestFile(file: Readable, options: IngestOptions) {
    const { client, indexName, delimiter } = options;

    const numDocuments = await new Promise<number>((resolve, reject) => {
      let numFailedDocuments = 0;

      parseStream(file, { headers: true, delimiter })
        .validate((row: any) => {
          for (const key in row) {
            if (!!!key) {
              return false;
            }
          }
          return true;
        })
        .on('data', (row) => {
          client.index({
            index: indexName,
            body: row,
          });
        })
        .on('error', (error) => reject(error))
        .on('data-invalid', () => numFailedDocuments++)
        .on('end', (rowCount: number) => resolve(rowCount - numFailedDocuments));
    });

    return {
      total: numDocuments,
      message: `Indexed ${numDocuments} documents`,
    };
  }

  public async parseFile(file: Readable, limit: number, options: ParseOptions) {
    const { delimiter } = options;

    const documents: Array<Record<string, any>> = [];
    await new Promise<void>((resolve, reject) => {
      parseStream(file, { headers: true, delimiter })
        .validate((row: any) => {
          for (const key in row) {
            if (!!!key) {
              return false;
            }
          }
          return true;
        })
        .on('data', (row) => {
          if (documents.length >= limit) {
            resolve();
            file.destroy();
            return;
          }
          documents.push(row);
        })
        .on('data-invalid', () => reject('Invalid row'))
        .on('error', (error) => reject(error))
        .on('end', () => resolve());
    });

    return documents;
  }
}
