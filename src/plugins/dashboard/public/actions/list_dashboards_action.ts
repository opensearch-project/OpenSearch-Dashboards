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

/**
 * Counts panels from panelsJSON rather than the saved object's references.
 */
const readPanelCount = (panelsJSON?: string): number | undefined => {
  if (!panelsJSON) {
    return undefined;
  }
  try {
    const panels = JSON.parse(panelsJSON);
    return Array.isArray(panels) ? panels.length : undefined;
  } catch {
    return undefined;
  }
};

export const LIST_DASHBOARDS_TOOL_DEFINITION = {
  name: 'list_dashboards',
  description: `Browses the dashboards this user can see as a catalogue: one summary row per dashboard, carrying its title, description, panel count, last update time and the id. A row describes a dashboard from the outside and never says what is inside it.
    WHEN TO USE: to survey the collection as a whole, for example "what dashboards do I have", "how many dashboards are there" or "which dashboard covers errors".
    WHEN NOT TO USE: this is not a lookup for one dashboard and not a way to inspect one. It cannot fetch a dashboard by id, and it reveals nothing about a dashboard's panels beyond how many there are.
    ONE CALL RETURNS ONLY ONE PAGE: the result is paginated and one call returns exactly one page of at most ${DASHBOARDS_PER_PAGE} dashboards, not the whole list. The response also reports how many dashboards matched in total and how many pages they span. When the user needs the FULL list, call this tool multiple times to cover every page and merge the results before answering. Requesting a page beyond totalPages will be rejected.`,
  parameters: {
    type: 'object' as const,
    properties: {
      search: {
        type: 'string',
        description: `Optional free-text term matched against dashboard titles and descriptions only. It never matches a dashboard id, so do not pass an id here. Omit it to list all dashboards.`,
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
          panelsJSON?: string;
        }>({
          type: getDashboardTypes(),
          search: args.search ? `${args.search}*` : undefined,
          fields: ['title', 'type', 'description', 'updated_at', 'panelsJSON'],
          perPage: DASHBOARDS_PER_PAGE,
          page,
          searchFields: ['title^3', 'type', 'description'],
          defaultSearchOperator: 'AND',
        });

        const totalPages = Math.max(1, Math.ceil(response.total / DASHBOARDS_PER_PAGE));
        // Every count below is a count of matches, which only equals the number
        // of dashboards that exist when no search term narrowed the query.
        const countedAs = args.search
          ? `${response.total} dashboards match ${JSON.stringify(args.search)}`
          : `${response.total} dashboards in total`;

        if (page > totalPages) {
          return {
            success: false,
            error: `Requested page ${page} is out of range: only ${totalPages} pages of results exist.`,
            totalDashboardsCount: response.total,
            totalPages,
            message: `There are ${countedAs}, spanning ${totalPages} pages. Request a page within that range, or narrow the search term.`,
          };
        }

        if (response.total === 0 && args.search) {
          return {
            success: true,
            totalDashboardsCount: 0,
            page,
            totalPages,
            perPage: DASHBOARDS_PER_PAGE,
            returnedCount: 0,
            dashboards: [],
            search: args.search,
            message: `No dashboards match ${JSON.stringify(
              args.search
            )}. Only titles and descriptions are searched, so an id or a phrase copied off the page will never match. Dashboards may still exist: call again without a search term before telling the user they have none.`,
          };
        }

        const dashboards = (response.savedObjects ?? []).map((savedObject) => {
          const panelCount = readPanelCount(savedObject.attributes?.panelsJSON);
          return {
            id: savedObject.id,
            type: savedObject.type,
            title: savedObject.attributes?.title,
            description: savedObject.attributes?.description,
            updatedAt: savedObject.updated_at,
            ...(panelCount !== undefined && { panelCount }),
          };
        });

        return {
          success: true,
          totalDashboardsCount: response.total,
          page,
          totalPages,
          perPage: DASHBOARDS_PER_PAGE,
          returnedCount: dashboards.length,
          dashboards,
          ...(args.search && { search: args.search }),
          message: `Getting page ${page} of ${totalPages} (${countedAs}).`,
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
