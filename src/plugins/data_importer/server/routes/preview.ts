/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from 'src/core/server';
import { schema, TypeOf } from '@osd/config-schema';
import _ from 'lodash';
import { FileParserService } from '../parsers/file_parser_service';
import { configSchema } from '../../config';
import { CSV_SUPPORTED_DELIMITERS } from '../../common/constants';
import { decideClient, determineMapping } from '../utils/util';
import { FileStream } from '../types';

export function previewRoute(
  router: IRouter,
  config: TypeOf<typeof configSchema>,
  fileParsers: FileParserService,
  dataSourceEnabled: boolean
) {
  router.post(
    {
      path: '/api/data_importer/_preview',
      options: {
        body: {
          maxBytes: config.maxFileSizeBytes,
          accepts: 'multipart/form-data',
          output: 'stream',
        },
      },
      validate: {
        query: schema.object({
          indexName: schema.string({ minLength: 1 }),
          createMode: schema.boolean(),
          fileExtension: schema.string({ minLength: 1 }),
          dataSource: schema.maybe(schema.string()),
          delimiter: schema.maybe(
            schema.string({
              validate(value: string) {
                if (!CSV_SUPPORTED_DELIMITERS.includes(value)) {
                  return `must be a supported delimiter`;
                }
              },
            })
          ),
        }),
        body: schema.object({
          file: schema.stream(),
        }),
      },
    },
    async (context, request, response) => {
      const fileExtension = request.query.fileExtension.startsWith('.')
        ? request.query.fileExtension.slice(1)
        : request.query.fileExtension;

      const parser = fileParsers.getFileParser(fileExtension);
      if (!parser) {
        return response.badRequest({
          body: `${fileExtension} is not a registered or supported filetype`,
        });
      }

      const client = await decideClient(dataSourceEnabled, context, request.query.dataSource);
      if (!!!client) {
        return response.notFound({
          body: 'Data source is not enabled or does not exist',
        });
      }

      if (!request.query.createMode) {
        try {
          const indexExists = await client.indices.exists({
            index: request.query.indexName,
          });

          if (!indexExists.body) {
            return response.notFound({
              body: `Index ${request.query.indexName} does not exist`,
            });
          }
        } catch (e) {
          return response.internalError({
            body: `Error checking if index exists: ${e}`,
          });
        }
      }

      const file = request.body.file as FileStream;
      const documents = (
        await parser.parseFile(file, config.filePreviewDocumentsCount, {
          delimiter: request.query.delimiter,
        })
      ).slice(0, config.filePreviewDocumentsCount);

      try {
        // Ensure OpenSearch can handle the deeply nested objects
        const nestedObjectsLimit =
          (
            await client.cluster.getSettings({
              include_defaults: true,
              filter_path: '**.nested_objects.limit',
            })
          ).body.defaults?.indices?.mapping?.nested_objects?.limit ?? 50000;

        // Some documents may omit fields so we must merge into one large document
        const predictedMapping = determineMapping(_.merge(documents), Number(nestedObjectsLimit));

        const existingMapping = !request.query.createMode
          ? (await client.indices.getMapping({ index: request.query.indexName })).body[
              request.query.indexName
            ].mappings
          : undefined;

        return response.ok({
          body: {
            predictedMapping,
            documents,
            ...(existingMapping && { existingMapping }),
          },
        });
      } catch (e) {
        return response.internalError({
          body: `Error determining mapping: ${e}`,
        });
      }
    }
  );
}
