/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
import { IFileParser, IngestOptions, ParseOptions, ValidationOptions } from '../types';

export class JSONParser implements IFileParser {
  public async validateText(text: string, _: ValidationOptions) {
    if (text.length < 1) {
      return false;
    }
    try {
      const obj = JSON.parse(text);
      return obj && typeof obj === 'object';
    } catch (e) {
      return false;
    }
  }

  public async ingestText(text: string, options: IngestOptions) {
    const { client, indexName } = options;
    const document = JSON.parse(text);
    await client.index({
      index: indexName,
      body: document,
    });
    return {
      total: 1,
      message: `Indexed 1 document`,
    };
  }

  public async ingestFile(file: Readable, options: IngestOptions) {
    const { client, indexName } = options;

    await new Promise((resolve, reject) => {
      let rawData = '';
      file
        .on('data', (chunk) => (rawData += chunk))
        .on('error', (e: any) => reject(e))
        .on('end', async () => {
          try {
            const document = JSON.parse(rawData);
            await client.index({
              index: indexName,
              body: document,
            });
          } catch (e) {
            reject(e);
          }
          resolve(undefined);
        });
    });

    return {
      total: 1,
      message: `Indexed 1 document`,
    };
  }

  public async parseFile(file: Readable, limit: number, _: ParseOptions) {
    const documents: Array<Record<string, any>> = [];
    await new Promise<void>((resolve, reject) => {
      let rawData = '';
      file
        .on('data', (chunk) => (rawData += chunk))
        .on('error', (e: any) => reject(e))
        .on('end', async () => {
          try {
            const document = JSON.parse(rawData);
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
