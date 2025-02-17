/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse } from 'ndjson';
import { Readable } from 'stream';
import { IFileParser, IngestOptions, ParseOptions, ValidationOptions } from '../types';

export class NDJSONParser implements IFileParser {
  public async validateText(text: string, _: ValidationOptions) {
    const stringStream = new Readable();
    stringStream._read = () => {};
    stringStream.push(text);
    stringStream.push(null);

    return await new Promise<boolean>((promise, reject) => {
      stringStream
        .pipe(parse({ strict: true }))
        .on('error', (e: any) => reject(e))
        .on('data', () => {})
        .on('end', () => promise(true));
    });
  }

  public async ingestText(text: string, options: IngestOptions) {
    const { client, indexName } = options;
    const stringStream = new Readable();
    stringStream._read = () => {};
    stringStream.push(text);
    stringStream.push(null);

    const numDocuments = await new Promise<number>((promise, reject) => {
      const tasks: Array<Promise<void>> = [];
      let numDocumentsCount = 0;

      stringStream
        .pipe(parse({ strict: true }))
        .on('error', (e: any) => reject(e))
        .on('data', async (document: object) => {
          const task = (async () => {
            try {
              await client.index({
                index: indexName,
                body: document,
              });
              numDocumentsCount++;
            } catch (e) {
              reject(e);
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
      message: `Indexed ${numDocuments} documents`,
    };
  }

  public async ingestFile(file: Readable, options: IngestOptions) {
    const { client, indexName } = options;

    const numDocuments = await new Promise<number>((resolve, reject) => {
      const tasks: Array<Promise<void>> = [];
      let numDocumentsCount = 0;
      file
        .pipe(parse({ strict: true }))
        .on('error', (e: any) => reject(e))
        .on('data', async (document: object) => {
          const task = (async () => {
            try {
              await client.index({
                index: indexName,
                body: document,
              });
              numDocumentsCount++;
            } catch (e) {
              reject(e);
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
      message: `Indexed ${numDocuments} documents`,
    };
  }

  public async parseFile(file: Readable, limit: number, _: ParseOptions) {
    const documents: Array<Record<string, any>> = [];
    await new Promise<void>((resolve, reject) => {
      file
        .pipe(parse({ strict: true }))
        .on('error', (e: any) => reject(e))
        .on('data', (document: Record<string, any>) => {
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
