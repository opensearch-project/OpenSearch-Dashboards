/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFileParser } from '../types';

export class FileParserService {
  private readonly _fileParsers: Map<string, IFileParser>;
  constructor() {
    this._fileParsers = new Map<string, IFileParser>();
  }

  public registerFileParser(fileType: string, fileParser: IFileParser) {
    if (this._fileParsers.has(fileType)) {
      throw new Error(`File parser for ${fileType} already exists`);
    }
    this._fileParsers.set(fileType, fileParser);
  }

  public getFileParser(fileType: string) {
    return this._fileParsers.get(fileType);
  }

  public hasFileParserBeenRegistered(fileType: string) {
    return this._fileParsers.has(fileType);
  }
}
