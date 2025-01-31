/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { FileParserService } from '../parsers/file_parser_service';
import { CSV_SUPPORTED_DELIMITERS } from '../../common/constants';
import { IRouter } from '../../../../core/server';
import { configSchema } from '../../config';
import { decideClient } from '../utils/util';

export function importTextRoute(
  router: IRouter,
  config: TypeOf<typeof configSchema>,
  fileParsers: FileParserService,
  dataSourceEnabled: boolean
) {
  router.post(
    {
      path: '/api/data_importer/_import_text',
      validate: {
        query: schema.object({
          fileType: schema.string({
            validate(value: string) {
              if (!config.enabledFileTypes.includes(value)) {
                return `must be an enabled file type`;
              }
            },
          }),
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
          text: schema.string({ minLength: 1, maxLength: config.maxTextCount }),
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

      let isValid;
      try {
        isValid = await fileParsers
          .getFileParser(request.query.fileType)
          ?.validateText(request.body.text, { delimiter: request.query.delimiter });
      } catch (e) {
        return response.badRequest({
          body: `Text is not valid: ${e}`,
        });
      }

      if (!isValid) {
        return response.badRequest({
          body: 'Text is not valid',
        });
      }

      try {
        const message = await fileParsers
          .getFileParser(request.query.fileType)
          ?.ingestText(request.body.text, {
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
          body: `Error ingesting text: ${e}`,
        });
      }
    }
  );
}
