/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { extname } from 'path';
import { Readable } from 'stream';
import { FileParserService } from '../parsers/file_parser_service';
import { CSV_SUPPORTED_DELIMITERS } from '../../common/constants';
import { IRouter } from '../../../../core/server';
import { configSchema } from '../../config';
import { decideClient } from '../utils/util';

interface FileStream extends Readable {
  hapi: {
    filename: string;
  };
}

export function importFileRoute(
  router: IRouter,
  config: TypeOf<typeof configSchema>,
  fileParsers: FileParserService,
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
          indexName: schema.string(),
          delimiter: schema.maybe(
            schema.string({
              validate(value: string) {
                if (!CSV_SUPPORTED_DELIMITERS.includes(value)) {
                  return `must be a supported delimiter`;
                }
              },
            })
          ),
          dataSource: schema.maybe(schema.string()),
        }),
        body: schema.object({
          file: schema.stream(),
        }),
      },
    },
    async (context, request, response) => {
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

      const file = request.body.file as FileStream;
      const fileExtension = extname(file.hapi.filename).toLowerCase();
      const fileType = fileExtension.startsWith('.') ? fileExtension.slice(1) : fileExtension;

      if (!config.enabledFileTypes.includes(fileType)) {
        return response.badRequest({
          body: `File type ${fileType} is not supported or enabled`,
        });
      }

      try {
        const message = await fileParsers.getFileParser(fileType)?.ingestFile(file, {
          indexName: request.query.indexName,
          client,
          delimiter: request.query.delimiter,
          dataSourceId: request.query.dataSource,
        });

        return response.ok({
          body: {
            message,
            success: true,
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
