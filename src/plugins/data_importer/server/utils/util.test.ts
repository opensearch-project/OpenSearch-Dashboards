/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { decideClient, validateEnabledFileTypes } from './util';
import { coreMock } from '../../../../core/server/mocks';
import { FileParserService } from '../parsers/file_parser_service';
import { IFileParser } from '../types';

describe('util', () => {
  describe('decideClient()', () => {
    const mockContext = {
      core: coreMock.createRequestHandlerContext(),
      dataSource: {
        opensearch: {
          getClient: jest.fn().mockReturnValue({}),
        },
      },
    };

    beforeEach(() => {
      mockContext.dataSource.opensearch.getClient.mockClear();
    });

    it('should return MDS client', async () => {
      const dataSourceEnabled = true;
      const dataSourceId = 'foo';
      const client = await decideClient(dataSourceEnabled, mockContext, dataSourceId);
      expect(mockContext.dataSource.opensearch.getClient).toBeCalledWith(dataSourceId);
      expect(client).toMatchObject({});
    });

    it.each([
      {
        dataSourceEnabled: false,
        dataSourceId: undefined,
      },
      {
        dataSourceEnabled: true,
        dataSourceId: undefined,
      },
      {
        dataSourceEnabled: false,
        dataSourceId: 'foo',
      },
    ])(
      'should return local cluster client when dataSourceEnabled is $dataSourceEnabled and dataSourceId is $dataSourceId',
      async ({ dataSourceEnabled, dataSourceId }) => {
        const client = await decideClient(dataSourceEnabled, mockContext, dataSourceId);
        expect(client).toMatchObject(mockContext.core.opensearch.client.asCurrentUser);
      }
    );
  });

  describe('validateEnabledFileTypes()', () => {
    let fileParserService: FileParserService;

    beforeEach(() => {
      fileParserService = new FileParserService();
    });

    it.each([
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: ['csv', 'ndjson', 'geojson'],
        throwsError: false,
      },
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: ['csv', 'ndjson'],
        throwsError: false,
      },
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: [],
        throwsError: false,
      },
      {
        registeredFileTypes: [],
        configEnabledFileTypes: [],
        throwsError: false,
      },
      {
        registeredFileTypes: [],
        configEnabledFileTypes: ['json'],
        throwsError: true,
      },
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: ['csv', 'ndjson', 'json'],
        throwsError: true,
      },
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: ['csv', 'ndjson', 'json', 'geojson'],
        throwsError: true,
      },
    ])(
      'should throw an error should be $throwsError',
      ({ registeredFileTypes, configEnabledFileTypes, throwsError }) => {
        const dummyFileParser: IFileParser = {
          validateText: jest.fn(),
          ingestText: jest.fn(),
          ingestFile: jest.fn(),
        };

        registeredFileTypes.forEach((fileType: string) => {
          fileParserService.registerFileParser(fileType, { ...dummyFileParser });
        });

        if (throwsError) {
          expect(() => {
            validateEnabledFileTypes(configEnabledFileTypes, fileParserService);
          }).toThrowError();
        } else {
          expect(() => {
            validateEnabledFileTypes(configEnabledFileTypes, fileParserService);
          }).not.toThrowError();
        }
      }
    );
  });
});
