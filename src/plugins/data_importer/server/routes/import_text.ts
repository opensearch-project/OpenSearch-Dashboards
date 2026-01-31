/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { v4 as uuidv4 } from 'uuid';
import { FileProcessorService } from '../processors/file_processor_service';
import { CSV_SUPPORTED_DELIMITERS } from '../../common/constants';
import { IRouter } from '../../../../core/server';
import { configSchema } from '../../config';
import { decideClient } from '../utils/util';

export function importTextRoute(
  router: IRouter,
  config: TypeOf<typeof configSchema>,
  fileProcessors: FileProcessorService,
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
          indexName: schema.string({ minLength: 1 }),
          createMode: schema.boolean(),
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
          importIdentifier: schema.maybe(
            schema.string({
              validate(value: string) {
                if (!/^[a-z][a-z0-9_-]*$/i.test(value)) {
                  return `must be alphanumeric with hyphens/underscores`;
                }
              },
            })
          ),
        }),
        body: schema.object({
          text: schema.string({ minLength: 1, maxLength: config.maxTextCount }),
          mapping: schema.maybe(schema.string({ minLength: 1 })),
        }),
      },
    },
    async (context, request, response) => {
      const processor = fileProcessors.getFileProcessor(request.query.fileType);
      if (!processor || !processor.validateText || !processor.ingestText) {
        return response.badRequest({
          body: `${request.query.fileType} is not a registered or supported filetype`,
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

      // Generate lookup ID if import identifier is provided
      const lookupId = request.query.importIdentifier ? uuidv4() : undefined;
      const lookupField = '__lookup';

      if (request.query.createMode) {
        const mapping = request.body.mapping;
        const mappingObj = mapping ? JSON.parse(mapping) : {};

        // Add __lookup field to mapping if using import identifier
        if (request.query.importIdentifier) {
          mappingObj.properties = mappingObj.properties || {};
          mappingObj.properties[lookupField] = {
            type: 'keyword',
          };
        }

        try {
          await client.indices.create({
            index: request.query.indexName,
            ...(Object.keys(mappingObj).length > 0 && { body: { mappings: mappingObj } }),
          });
        } catch (e) {
          return response.internalError({
            body: `Error creating index: ${e}`,
          });
        }
      }

      let isValid;
      try {
        isValid = await processor.validateText(request.body.text, {
          delimiter: request.query.delimiter,
        });
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
        const message = await processor.ingestText(request.body.text, {
          indexName: request.query.indexName,
          client,
          delimiter: request.query.delimiter,
          dataSourceId: request.query.dataSource,
          lookupId,
          lookupField,
        });

        // Create filtered alias if import identifier is provided
        if (request.query.importIdentifier && lookupId && message.failedRows.length < 1) {
          try {
            await client.indices.updateAliases({
              body: {
                actions: [
                  {
                    add: {
                      index: request.query.indexName,
                      alias: request.query.importIdentifier,
                      filter: {
                        term: {
                          [lookupField]: lookupId,
                        },
                      },
                    },
                  },
                ],
              },
            });
          } catch (aliasError) {
            // Log error but don't fail the import
            context.dataImporter!.logger.error(
              `Failed to create alias ${request.query.importIdentifier}: ${aliasError}`
            );
          }
        }

        return response.ok({
          body: {
            message,
            success: message.failedRows.length < 1,
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
