/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import { v4 as uuidv4 } from 'uuid';
import { FileProcessorService } from '../processors/file_processor_service';
import { CSV_SUPPORTED_DELIMITERS } from '../../common/constants';
import { IRouter } from '../../../../core/server';
import { configSchema } from '../../config';
import {
  decideClient,
  checkIndexExists,
  IndexAccessForbiddenError,
  BulkIndexForbiddenError,
  ALPHANUMERIC_REGEX_STRING,
  LOOKUP_FIELD,
} from '../utils/util';
import { fetchIndexMapping } from '../utils/coerce_to_mapping';
import { describeAliasError, pointLookupAlias } from '../utils/lookup_alias';

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
                if (!ALPHANUMERIC_REGEX_STRING.test(value)) {
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
        const indexExists = await checkIndexExists(client, request.query.indexName);

        if (!request.query.createMode && !indexExists) {
          return response.notFound({
            body: `Index ${request.query.indexName} does not exist`,
          });
        }
        if (request.query.createMode && indexExists) {
          return response.badRequest({
            body: `Index ${request.query.indexName} already exists`,
          });
        }
      } catch (e) {
        if (e instanceof IndexAccessForbiddenError) {
          return response.forbidden({ body: e.message });
        }
        return response.internalError({
          body: `Error checking if index exists: ${e.message || e}`,
        });
      }

      // Generate lookup ID if import identifier is provided
      const lookupId = request.query.importIdentifier ? uuidv4() : undefined;

      // Resolved target mapping, used to coerce values bound for text/keyword fields to strings
      let targetMapping: MappingTypeMapping | undefined;

      if (request.query.createMode) {
        const mapping = request.body.mapping;
        let mappingObj = {};

        if (mapping) {
          try {
            mappingObj = JSON.parse(mapping);
          } catch (e) {
            return response.badRequest({
              body: `Invalid mapping JSON: ${e}`,
            });
          }
        }

        // Add __lookup field to mapping if using import identifier
        if (request.query.importIdentifier) {
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          mappingObj.properties = mappingObj.properties || {};
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          mappingObj.properties[LOOKUP_FIELD] = {
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
        targetMapping =
          Object.keys(mappingObj).length > 0 ? (mappingObj as MappingTypeMapping) : undefined;
      } else {
        try {
          targetMapping = await fetchIndexMapping(client, request.query.indexName);
        } catch (mappingError) {
          // Not fatal: import without coercion; any type mismatch is reported per row by _bulk
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          context.dataImporter?.logger.error(
            `Failed to fetch mapping for ${request.query.indexName}, importing without type coercion: ${mappingError}`
          );
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
          lookupField: LOOKUP_FIELD,
          mapping: targetMapping,
        });

        const indexedCount = message.total - message.failedRows.length;
        const success = message.failedRows.length < 1;
        // Some rows landed and some did not: the UI should warn with message.errorSummary
        const partial = indexedCount > 0 && !success;

        // Create the filtered alias whenever ANY rows landed. On partial failure the landed rows
        // already carry the __lookup uuid; skipping the alias would orphan them on the (shared)
        // index with no way to address or clean them up.
        let aliasCreated: boolean | undefined;
        let aliasError: string | undefined;
        if (request.query.importIdentifier && lookupId) {
          aliasCreated = false;
          if (indexedCount > 0) {
            try {
              // Atomically moves the alias off any previous import so a re-import overwrites the
              // lookup instead of unioning old and new indices
              await pointLookupAlias(client, {
                indexName: request.query.indexName,
                alias: request.query.importIdentifier,
                lookupId,
                lookupField: LOOKUP_FIELD,
              });
              aliasCreated = true;
            } catch (err) {
              // The rows are already indexed, so this stays a 200, but the lookup is unreachable
              // without its alias: aliasError tells the client to fail loudly with a usable message
              aliasError = describeAliasError(err);
              // @ts-expect-error TS2339 TODO(ts-error): fixme
              context.dataImporter?.logger.error(
                `Failed to create alias ${request.query.importIdentifier}: ${err}`
              );
            }
          }
        }

        return response.ok({
          body: {
            message,
            success,
            partial,
            ...(aliasCreated !== undefined && { aliasCreated }),
            ...(aliasError !== undefined && { aliasError }),
          },
        });
      } catch (e) {
        if (e instanceof BulkIndexForbiddenError) {
          return response.forbidden({ body: e.message });
        }
        return response.internalError({
          body: `Error ingesting text: ${e}`,
        });
      }
    }
  );
}
