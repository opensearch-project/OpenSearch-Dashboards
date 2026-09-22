/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IHttpFetchError, SavedObjectsClientContract } from '../../../../core/public';
import { AssistantAction } from '../../../context_provider/public';

const DASHBOARDS_PER_PAGE = 50;

interface ListDashboardsArgs {
  search?: string;
  page?: number;
}

export const LIST_DASHBOARDS_TOOL_DEFINITION = {
  name: 'list_dashboards',
  description: `Lists the dashboards this user can see, with their id, title, description and last update time.
    WHEN TO USE: choose this tool when the user asks which dashboards exist or wants one found by name or topic, for example "what dashboards do I have" or "find the dashboard about errors".
    ONE CALL RETURNS ONLY ONE PAGE: the result is paginated and one call returns exactly one page of at most ${DASHBOARDS_PER_PAGE} dashboards, not the whole list. The response also reports how many dashboards matched in total and how many pages they span. When the user needs the FULL list, call this tool multiple times to cover every page and merge the results before answering. Requesting a page beyond totalPages will be rejected.`,
  parameters: {
    type: 'object' as const,
    properties: {
      search: {
        type: 'string',
        description: `Optional term matched against dashboard titles and descriptions. Omit to list all dashboards.`,
      },
      page: {
        type: 'integer',
        minimum: 1,
        description: `Page to fetch, starting at 1. Defaults to 1. Only request a later page when a previous response reported more than one page, and keep the same search term.`,
      },
    },
    required: [],
  },
};

interface ListDashboardsDeps {
  savedObjectsClient: SavedObjectsClientContract;
  getDashboardTypes: () => string[];
}

export function registerListDashboardsAction(
  registerAction: ((action: AssistantAction<ListDashboardsArgs>) => void) | undefined,
  { savedObjectsClient, getDashboardTypes }: ListDashboardsDeps
) {
  if (!registerAction) return;

  registerAction({
    ...LIST_DASHBOARDS_TOOL_DEFINITION,
    handler: async (args: ListDashboardsArgs) => {
      const hasPage = args.page !== undefined && args.page !== null;
      if (hasPage && (!Number.isInteger(args.page) || args.page! < 1)) {
        return {
          success: false,
          error: `Invalid page ${JSON.stringify(args.page)}.`,
          message: 'page must be an integer of 1 or greater.',
        };
      }
      const page = hasPage ? args.page! : 1;

      try {
        const response = await savedObjectsClient.find<{
          title?: string;
          description?: string;
        }>({
          type: getDashboardTypes(),
          search: args.search ? `${args.search}*` : undefined,
          fields: ['title', 'type', 'description', 'updated_at'],
          perPage: DASHBOARDS_PER_PAGE,
          page,
          searchFields: ['title^3', 'type', 'description'],
          defaultSearchOperator: 'AND',
        });

        const totalPages = Math.max(1, Math.ceil(response.total / DASHBOARDS_PER_PAGE));

        if (page > totalPages) {
          return {
            success: false,
            error: `Requested page ${page} is out of range: only ${totalPages} pages of results exist.`,
            totalDashboardsCount: response.total,
            totalPages,
            message: `There are ${response.total} dashboards in ${totalPages} pages. Request a page within that range, or narrow the search term.`,
          };
        }

        const dashboards = (response.savedObjects ?? []).map((savedObject) => ({
          id: savedObject.id,
          type: savedObject.type,
          title: savedObject.attributes?.title,
          description: savedObject.attributes?.description,
          updatedAt: savedObject.updated_at,
        }));

        return {
          success: true,
          totalDashboardsCount: response.total,
          page,
          totalPages,
          perPage: DASHBOARDS_PER_PAGE,
          returnedCount: dashboards.length,
          dashboards,
          message: `Getting page ${page} of ${totalPages} (${response.total} dashboards in total).`,
        };
      } catch (error) {
        const { body, message } = (error ?? {}) as IHttpFetchError;
        return {
          success: false,
          error: body?.message || message || 'Unknown error',
          message: 'Could not read the dashboard list.',
        };
      }
    },
  });
}
