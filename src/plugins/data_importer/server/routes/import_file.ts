/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { FileProcessorService } from '../processors/file_processor_service';
import { CSV_SUPPORTED_DELIMITERS } from '../../common/constants';
import { IRouter } from '../../../../core/server';
import { configSchema } from '../../config';
import { decideClient } from '../utils/util';
import { FileStream } from '../types';

export function importFileRoute(
  router: IRouter,
  config: TypeOf<typeof configSchema>,
  fileProcessors: FileProcessorService,
  dataSourceEnabled: boolean
) {
  router.post(
    {
      path: '/api/data_importer/_import_file',
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
          mapping: schema.maybe(schema.string({ minLength: 1 })),
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

      try {
        const indexExists = await client.indices.exists({
          index: request.query.indexName,
        });

        if (!request.query.createMode && !indexExists.body) {
          return response.notFound({
            body: `Index ${request.query.indexName} does not exist`,
          });
        }
        if (request.query.createMode && indexExists.body) {
          return response.badRequest({
            body: `Index ${request.query.indexName} already exists`,
          });
        }
      } catch (e) {
        return response.internalError({
          body: `Error checking if index exists: ${e}`,
        });
      }

      if (request.query.createMode) {
        const mapping = request.body.mapping;

        try {
          await client.indices.create({
            index: request.query.indexName,
            ...(mapping && { body: { mappings: JSON.parse(mapping) } }),
          });
        } catch (e) {
          return response.internalError({
            body: `Error creating index: ${e}`,
          });
        }
      }

      const file = request.body.file as FileStream;

      // Batching logic for large CSV uploads using bulk API
      try {
        // Parse the file into rows (assume processor.parseFile returns an array of objects)
        // Use a large previewCount to get all rows
        const previewCount = Number.MAX_SAFE_INTEGER;
        const rows = await processor.parseFile(file, previewCount, {
          delimiter: request.query.delimiter,
        });
        const flatRows = Array.isArray(rows[0]) ? rows.flat() : rows;

        const BATCH_SIZE = 1000;
        const failedRows: any[] = [];
        for (let i = 0; i < flatRows.length; i += BATCH_SIZE) {
          const batch = flatRows.slice(i, i + BATCH_SIZE);
          // Build bulk body
          const bulkBody = [];
          for (const row of batch) {
            bulkBody.push({ index: { _index: request.query.indexName } });
            bulkBody.push(row);
          }
          const bulkResponse = await client.bulk({ body: bulkBody });
          // Collect failed rows
          if (bulkResponse.body.errors) {
            bulkResponse.body.items.forEach((item: any, idx: number) => {
              if (item.index && item.index.error) {
                failedRows.push(batch[idx]);
              }
            });
          }
        }
        const message = {
          failedRows,
          totalRows: rows.length,
        };
        return response.ok({
          body: {
            message,
            success: failedRows.length < 1,
          },
        });
      } catch (e) {
        return response.internalError({
          body: `Error ingesting file: ${e}`,
        });
      }
    }
  );
}
