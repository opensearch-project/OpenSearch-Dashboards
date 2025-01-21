import { schema } from '@osd/config-schema';
import { IRouter, RequestHandlerContext } from '../../../../core/server';

interface BulkResponseItem {
  index?: {
    _index: string;
    _id: string;
    status: number;
    error?: {
      type: string;
      reason: string;
    };
  };
}

interface BulkResponseBody {
  took: number;
  errors: boolean;
  items: BulkResponseItem[];
}

export function registerRoutes(router: IRouter) {
  router.post(
    {
      path: '/api/data_importer/upload',
      validate: {
        body: schema.object({
          documents: schema.arrayOf(schema.recordOf(schema.string(), schema.any())),
          indexName: schema.string(),
          fieldMappings: schema.recordOf(schema.string(), schema.string()),
        }),
      },
    },
    async (context: RequestHandlerContext, request, response) => {
      try {
        const { documents, indexName, fieldMappings } = request.body;

        // Get the client
        const client = context.core.opensearch.client.asCurrentUser;

        // Check if the index exists
        const indexExists = await client.indices.exists({ index: indexName });

        // Create the index if it does not exist
        if (!indexExists.body) {
          await client.indices.create({
            index: indexName,
            body: {
              mappings: {
                properties: Object.keys(fieldMappings).reduce((acc, key) => {
                  // Update field type to 'text', 'keyword', 'integer', 'float', etc.
                  let fieldType = fieldMappings[key];
                  if (fieldType === 'string') {
                    fieldType = 'text';
                  } else if (fieldType === 'number') {
                    fieldType = 'float'; // or 'integer', 'double', etc. based on your data
                  }
                  acc[key] = { type: fieldType };
                  return acc;
                }, {} as any),
              },
            },
          });
        }

        // Process in batches
        const batchSize = 1000;
        let successCount = 0;
        const errors: Array<{ reason: string; document?: any }> = [];

        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          const operations = batch.flatMap((doc) => [{ index: { _index: indexName } }, doc]);

          const bulkBody = operations.map((op) => JSON.stringify(op)).join('\n') + '\n';

          try {
            const bulkResponse = await client.transport.request({
              method: 'POST',
              path: '/_bulk',
              body: bulkBody,
              querystring: 'refresh=true',
            });

            const responseBody = bulkResponse.body as BulkResponseBody;

            if (responseBody.items) {
              successCount += responseBody.items.filter(
                (item) => item.index && item.index.status >= 200 && item.index.status < 300
              ).length;

              responseBody.items.forEach((item, idx) => {
                if (item.index?.error) {
                  errors.push({
                    reason: item.index.error.reason,
                    document: batch[Math.floor(idx / 2)],
                  });
                }
              });
            }
          } catch (error: any) {
            errors.push({
              reason: error.message || 'Unknown error during bulk operation',
              document: batch[0],
            });
          }
        }

        return response.ok({
          body: {
            documentsCount: successCount,
            totalDocuments: documents.length,
            failedDocuments: errors.length,
            errors: errors.length > 0 ? errors : false,
          },
        });
      } catch (error: any) {
        return response.custom({
          statusCode: 500,
          body: {
            message: error.message || 'Internal server error',
          },
        });
      }
    }
  );
}
