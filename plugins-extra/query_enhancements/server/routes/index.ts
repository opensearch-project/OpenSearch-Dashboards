import { schema } from '@osd/config-schema';
import {
  IOpenSearchDashboardsResponse,
  IRouter,
  Logger,
  ResponseError,
} from '../../../../src/core/server';
import { ISearchStrategy } from '../../../../src/plugins/data/server';
import {
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
} from '../../../../src/plugins/data/common';

export function defineRoutes(
  logger: Logger,
  router: IRouter,
  searchStrategies: Record<
    string,
    ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse>
  >
) {
  router.post(
    {
      path: `/api/pplql/search`,
      validate: {
        body: schema.object({
          query: schema.object({
            qs: schema.string(),
            format: schema.string(),
          }),
          df: schema.nullable(schema.object({}, { unknowns: 'allow' })),
        }),
      },
    },
    async (context, req, res): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const queryRes: IDataFrameResponse = await searchStrategies.ppl.search(
          context,
          req as any,
          {}
        );
        const result: any = {
          body: {
            ...queryRes,
          },
        };
        return res.ok(result);
      } catch (err) {
        logger.error(err);
        return res.custom({
          statusCode: 500,
          body: err,
        });
      }
    }
  );

  // sql
  router.post(
    {
      path: `/api/sqlql/search`,
      validate: {
        body: schema.object({
          query: schema.object({
            qs: schema.string(),
            format: schema.string(),
          }),
          df: schema.nullable(schema.object({}, { unknowns: 'allow' })),
        }),
      },
    },
    async (context, req, res): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const queryRes: IDataFrameResponse = await searchStrategies.sql.search(
          context,
          req as any,
          {}
        );
        const result: any = {
          body: {
            ...queryRes,
          },
        };
        return res.ok(result);
      } catch (err) {
        logger.error(err);
        return res.custom({
          statusCode: 500,
          body: err,
        });
      }
    }
  );
}
