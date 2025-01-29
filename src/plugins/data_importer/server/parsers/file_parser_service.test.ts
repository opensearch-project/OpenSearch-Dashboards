/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFileParser } from '../types';
import { FileParserService } from './file_parser_service';
import { CSVParser } from './csv_parser';

describe('FileParserService', () => {
  let fileParserService: FileParserService;

  beforeEach(() => {
    fileParserService = new FileParserService();
  });

  describe('registerFileParser()', () => {
    it('should register a file parser', () => {
      const fileParser: IFileParser = {
        validateText: jest.fn(),
        ingestText: jest.fn(),
        ingestFile: jest.fn(),
      };
      const csvParser = new CSVParser();
      fileParserService.registerFileParser('testFormat', fileParser);
      fileParserService.registerFileParser('csv', csvParser);

      expect(fileParserService.getFileParser('testFormat')).toMatchObject(fileParser);
      expect(fileParserService.getFileParser('csv')).toMatchObject(csvParser);
    });

    it('should throw an error when a duplicate file parser attempts to be registered', () => {
      const csvParser = new CSVParser();
      const otherCSVParser = new CSVParser();
      fileParserService.registerFileParser('testFormat', otherCSVParser);
      expect(() => fileParserService.registerFileParser('testFormat', csvParser)).toThrowError();
    });
  });

  describe('getFileParser()', () => {
    it('should return a file parser if registered', () => {
      const csvParser = new CSVParser();
      fileParserService.registerFileParser('csv', csvParser);

      expect(fileParserService.getFileParser('csv')).toMatchObject(csvParser);
      expect(fileParserService.getFileParser('nonexistentFormat')).toBe(undefined);
    });
  });

  describe('hasFileParserBeenRegistered()', () => {
    it('should return true if a file parser has been registered', () => {
      const csvParser = new CSVParser();
      fileParserService.registerFileParser('csv', csvParser);

      expect(fileParserService.hasFileParserBeenRegistered('csv')).toBe(true);
      expect(fileParserService.hasFileParserBeenRegistered('nonexistentFormat')).toBe(false);
    });
  });
});
