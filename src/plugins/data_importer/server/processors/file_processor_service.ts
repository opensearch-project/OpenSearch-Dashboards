/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFileProcessor } from '../types';

export class FileProcessorService {
  private readonly _fileProcessors: Map<string, IFileProcessor>;
  constructor() {
    this._fileProcessors = new Map<string, IFileProcessor>();
  }

  public registerFileProcessor(fileType: string, fileProcessor: IFileProcessor) {
    if (this._fileProcessors.has(fileType)) {
      throw new Error(`File processor for ${fileType} already exists`);
    }
    this._fileProcessors.set(fileType, fileProcessor);
  }

  public getFileProcessor(fileType: string) {
    return this._fileProcessors.get(fileType);
  }

  public hasFileProcessorBeenRegistered(fileType: string) {
    return this._fileProcessors.has(fileType);
  }
}
