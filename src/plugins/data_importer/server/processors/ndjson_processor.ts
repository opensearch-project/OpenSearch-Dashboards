/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse } from 'ndjson';
import { Readable } from 'stream';
import { IFileProcessor, IngestOptions, ParseOptions, ValidationOptions } from '../types';
import { isValidObject } from '../utils/util';

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
    const { client, indexName } = options;
    const stringStream = new Readable();
    stringStream._read = () => {};
    stringStream.push(text);
    stringStream.push(null);

    const failedRows: number[] = [];
    const numDocuments = await new Promise<number>((promise) => {
      const tasks: Array<Promise<void>> = [];
      let numDocumentsCount = 0;

      stringStream
        .pipe(parse({ strict: true }))
        .on('error', (_) => {
          const curRow = ++numDocumentsCount;
          failedRows.push(curRow);
        })
        .on('data', (document: Record<string, any>) => {
          const task = (async () => {
            const curRow = ++numDocumentsCount;
            try {
              await client.index({
                index: indexName,
                body: document,
              });
            } catch (e) {
              failedRows.push(curRow);
            }
          })();
          tasks.push(task);
        })
        .on('end', async () => {
          await Promise.all(tasks);
          promise(numDocumentsCount);
        });
    });

    return {
      total: numDocuments,
      message: `Indexed ${numDocuments - failedRows.length} documents`,
      failedRows: failedRows.sort((n1, n2) => n1 - n2),
    };
  }

  public async ingestFile(file: Readable, options: IngestOptions) {
    const { client, indexName } = options;

    const failedRows: number[] = [];
    const numDocuments = await new Promise<number>((resolve, reject) => {
      const tasks: Array<Promise<void>> = [];
      let numDocumentsCount = 0;

      file
        .pipe(parse({ strict: true }))
        .on('error', (e) =>
          reject(new Error(`Stopped processing after ${numDocumentsCount} rows due to: ${e}`))
        )
        .on('data', (document: Record<string, any>) => {
          const task = (async () => {
            const curRow = ++numDocumentsCount;
            if (!isValidObject(document)) {
              failedRows.push(curRow);
            } else {
              try {
                await client.index({
                  index: indexName,
                  body: document,
                });
              } catch (_) {
                failedRows.push(curRow);
              }
            }
          })();
          tasks.push(task);
        })
        .on('end', async () => {
          await Promise.all(tasks);
          resolve(numDocumentsCount);
        });
    });

    return {
      total: numDocuments,
      message: `Indexed ${numDocuments - failedRows.length} documents`,
      failedRows: failedRows.sort((n1, n2) => n1 - n2),
    };
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
