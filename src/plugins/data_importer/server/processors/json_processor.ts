/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
import { IFileProcessor, IngestOptions, ParseOptions, ValidationOptions } from '../types';
import { isValidObject } from '../utils/util';

export class JSONProcessor implements IFileProcessor {
  public async validateText(text: string, _: ValidationOptions) {
    if (text.length < 1) {
      return false;
    }
    try {
      const obj = JSON.parse(text);
      return obj && typeof obj === 'object' && isValidObject(obj);
    } catch (e) {
      return false;
    }
  }

  public async ingestText(text: string, options: IngestOptions) {
    const { client, indexName } = options;
    const document = JSON.parse(text);
    const isSuccessful = await new Promise<boolean>(async (resolve) => {
      try {
        await client.index({
          index: indexName,
          body: document,
        });
        resolve(true);
      } catch (e) {
        resolve(false);
      }
    });

    const total = isSuccessful ? 1 : 0;

    return {
      total: 1,
      message: `Indexed ${total} document`,
      failedRows: isSuccessful ? [] : [1],
    };
  }

  public async ingestFile(file: Readable, options: IngestOptions) {
    const { client, indexName } = options;

    const numSucessfulDocs = await new Promise<number>((resolve) => {
      let rawData = '';
      file
        .on('data', (chunk) => (rawData += chunk))
        .on('error', (_) => resolve(0))
        .on('end', async () => {
          try {
            const document = JSON.parse(rawData);
            if (!isValidObject(document)) {
              resolve(0);
            }
            await client.index({
              index: indexName,
              body: document,
            });
            resolve(1);
          } catch (_) {
            resolve(0);
          }
        });
    });

    return {
      total: 1,
      message: `Indexed ${numSucessfulDocs} document`,
      failedRows: numSucessfulDocs === 1 ? [] : [1],
    };
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
