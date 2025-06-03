/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from 'src/core/server';
import { schema, TypeOf } from '@osd/config-schema';
import _ from 'lodash';
import { FileProcessorService } from '../processors/file_processor_service';
import { configSchema } from '../../config';
import { CSV_SUPPORTED_DELIMITERS } from '../../common/constants';
import { decideClient, fetchDepthLimit, mergeCustomizerForPreview } from '../utils/util';
import { FileStream } from '../types';
import { determineMapping } from '../utils/determine_mapping';

export function previewRoute(
  router: IRouter,
  config: TypeOf<typeof configSchema>,
  fileProcessors: FileProcessorService,
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
          previewCount: schema.number({ min: 1, max: config.filePreviewDocumentsCount }),
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

      const processor = fileProcessors.getFileProcessor(fileExtension);
      if (!processor) {
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
      const documents: Array<Record<string, any>> = [];
      try {
        documents.push(
          ...(
            await processor.parseFile(file, request.query.previewCount, {
              delimiter: request.query.delimiter,
            })
          ).slice(0, request.query.previewCount)
        );
      } catch (e) {
        return response.badRequest({
          body: `Error parsing file: ${e}`,
        });
      }

      try {
        // Ensure OpenSearch can handle deep objects
        const nestedObjectsLimit = await fetchDepthLimit(client);
        // Some documents may omit fields so we must merge into one large document
        const predictedMapping = determineMapping(
          _.mergeWith(documents, mergeCustomizerForPreview),
          nestedObjectsLimit
        );

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
