/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFileProcessor } from '../types';
import { FileProcessorService } from './file_processor_service';
import { CSVProcessor } from './csv_processor';

describe('FileProcessorService', () => {
  let fileProcessorService: FileProcessorService;

  beforeEach(() => {
    fileProcessorService = new FileProcessorService();
  });

  describe('registerFileProcessor()', () => {
    it('should register a file processor', () => {
      const fileProcessor: IFileProcessor = {
        validateText: jest.fn(),
        ingestText: jest.fn(),
        ingestFile: jest.fn(),
        parseFile: jest.fn(),
      };
      const csvProcessor = new CSVProcessor();
      fileProcessorService.registerFileProcessor('testFormat', fileProcessor);
      fileProcessorService.registerFileProcessor('csv', csvProcessor);

      expect(fileProcessorService.getFileProcessor('testFormat')).toMatchObject(fileProcessor);
      expect(fileProcessorService.getFileProcessor('csv')).toMatchObject(csvProcessor);
    });

    it('should throw an error when a duplicate file processor attempts to be registered', () => {
      const csvProcessor = new CSVProcessor();
      const otherCSVProcessor = new CSVProcessor();
      fileProcessorService.registerFileProcessor('testFormat', otherCSVProcessor);
      expect(() =>
        fileProcessorService.registerFileProcessor('testFormat', csvProcessor)
      ).toThrowError();
    });
  });

  describe('getFileProcessor()', () => {
    it('should return a file processor if registered', () => {
      const csvProcessor = new CSVProcessor();
      fileProcessorService.registerFileProcessor('csv', csvProcessor);

      expect(fileProcessorService.getFileProcessor('csv')).toMatchObject(csvProcessor);
      expect(fileProcessorService.getFileProcessor('nonexistentFormat')).toBe(undefined);
    });
  });

  describe('hasFileProcessorBeenRegistered()', () => {
    it('should return true if a file processor has been registered', () => {
      const csvProcessor = new CSVProcessor();
      fileProcessorService.registerFileProcessor('csv', csvProcessor);

      expect(fileProcessorService.hasFileProcessorBeenRegistered('csv')).toBe(true);
      expect(fileProcessorService.hasFileProcessorBeenRegistered('nonexistentFormat')).toBe(false);
    });
  });
});
