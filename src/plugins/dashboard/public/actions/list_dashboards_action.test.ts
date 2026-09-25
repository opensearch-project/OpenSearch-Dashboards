/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../core/public';
import {
  registerListDashboardsAction,
  LIST_DASHBOARDS_TOOL_DEFINITION,
} from './list_dashboards_action';

const savedObject = (id: string, attributes: Record<string, unknown>, type = 'dashboard') => ({
  id,
  type,
  attributes,
  references: [],
  updated_at: '2026-09-01T00:00:00.000Z',
});

const PER_PAGE = 50;

describe('registerListDashboardsAction', () => {
  let find: jest.Mock;
  let registerAction: jest.Mock;
  let dashboardTypes: string[];

  const register = (registry: jest.Mock | undefined) =>
    registerListDashboardsAction(registry, {
      savedObjectsClient: { find } as unknown as SavedObjectsClientContract,
      getDashboardTypes: () => dashboardTypes,
    });

  const action = () => registerAction.mock.calls[0][0];
  const run = (args: { search?: string; page?: number } = {}) => action().handler!(args);

  const resolveWith = (savedObjects: unknown[], total = savedObjects.length) =>
    find.mockResolvedValue({ savedObjects, total, page: 1, perPage: PER_PAGE });

  beforeEach(() => {
    find = jest.fn();
    registerAction = jest.fn();
    dashboardTypes = ['dashboard'];
    register(registerAction);
    resolveWith([]);
  });

  it('registers exactly one action', () => {
    expect(registerAction).toHaveBeenCalledTimes(1);
  });

  it('stays silent when the context provider is unavailable', () => {
    registerAction.mockClear();

    expect(() => register(undefined)).not.toThrow();
    expect(registerAction).not.toHaveBeenCalled();
  });

  it('builds on the shared tool definition', () => {
    expect(action().name).toBe(LIST_DASHBOARDS_TOOL_DEFINITION.name);
    expect(action().parameters).toBe(LIST_DASHBOARDS_TOOL_DEFINITION.parameters);
    expect(action().parameters.required).toEqual([]);
  });

  it('tells the agent each call returns only one page', () => {
    expect(action().description).toContain('ONE CALL RETURNS ONLY ONE PAGE');
    expect(action().description).toContain('totalPages');
  });

  it('queries every registered dashboard type, resolved at call time', async () => {
    dashboardTypes = ['dashboard', 'custom-dashboard'];

    await run();

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ type: ['dashboard', 'custom-dashboard'] })
    );
  });

  it('lists everything when no search term is given', async () => {
    await run();

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ search: undefined }));
  });

  it('turns a search term into a prefix query weighted towards the title', async () => {
    await run({ search: 'errors' });

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'errors*',
        searchFields: ['title^3', 'type', 'description'],
        defaultSearchOperator: 'AND',
      })
    );
  });

  it('returns the fields the agent needs to describe each dashboard', async () => {
    resolveWith([
      savedObject('d1', { title: 'Errors', description: 'Error rates by service' }),
      savedObject('d2', { title: 'Latency' }, 'custom-dashboard'),
    ]);

    await expect(run()).resolves.toEqual({
      success: true,
      totalDashboardsCount: 2,
      page: 1,
      totalPages: 1,
      perPage: PER_PAGE,
      returnedCount: 2,
      message: 'Getting page 1 of 1 (2 dashboards in total).',
      dashboards: [
        {
          id: 'd1',
          type: 'dashboard',
          title: 'Errors',
          description: 'Error rates by service',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'd2',
          type: 'custom-dashboard',
          title: 'Latency',
          description: undefined,
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('reports an empty installation without failing', async () => {
    await expect(run()).resolves.toEqual(
      expect.objectContaining({
        success: true,
        totalDashboardsCount: 0,
        returnedCount: 0,
        dashboards: [],
      })
    );
  });

  describe('pagination', () => {
    it('asks for the first page by default', async () => {
      await run();

      expect(find).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: PER_PAGE }));
    });

    it('keeps the page size fixed so a page number keeps its meaning', async () => {
      await run({ page: 2 });

      expect(find).toHaveBeenCalledWith(expect.objectContaining({ perPage: PER_PAGE }));
    });

    it('forwards the requested page', async () => {
      resolveWith([savedObject('d1', { title: 'Errors' })], PER_PAGE * 4);

      await run({ page: 3 });

      expect(find).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
    });

    it('reports the page size it used', async () => {
      await expect(run()).resolves.toEqual(expect.objectContaining({ perPage: PER_PAGE }));
    });

    it.each([[undefined], [null]])('treats %p as "no page given"', async (page) => {
      const result = await run({ page } as { page?: number });

      expect(result.success).toBe(true);
      expect(find).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    describe('rejecting a page it cannot honour', () => {
      it.each([
        ['a fractional page', 1.7],
        ['zero', 0],
        ['a negative page', -2],
        ['a numeric string', '5'],
        ['a non-numeric string', 'abc'],
        ['NaN', NaN],
        ['Infinity', Infinity],
      ])('refuses %s instead of silently using page 1', async (_label, page) => {
        const result = await run({ page } as { page?: number });

        expect(result.success).toBe(false);
        expect(result.message).toContain('integer');
        expect(find).not.toHaveBeenCalled();
      });

      it('refuses a page past the end rather than returning the first page', async () => {
        resolveWith([], PER_PAGE * 2);

        const result = await run({ page: 9 });

        expect(result).toEqual(
          expect.objectContaining({
            success: false,
            totalDashboardsCount: PER_PAGE * 2,
            totalPages: 2,
          })
        );
        expect(result.error).toContain('9');
        expect(result.dashboards).toBeUndefined();
      });

      it('names the totals that put the page out of range', async () => {
        resolveWith([savedObject('d1', { title: 'Errors' })], 3);

        const result = await run({ page: 2 });

        expect(result.success).toBe(false);
        expect(result.error).toContain('page 2');
        expect(result.message).toContain('3 dashboards in 1 pages');
      });
    });

    it('reports how many pages there are', async () => {
      resolveWith([savedObject('d1', { title: 'Errors' })], PER_PAGE * 6);

      const result = await run();

      expect(result).toEqual(
        expect.objectContaining({
          totalDashboardsCount: PER_PAGE * 6,
          page: 1,
          totalPages: 6,
        })
      );
      expect(result.message).toContain('page 1 of 6');
    });

    it('says which page it is on when it is the last one', async () => {
      resolveWith([savedObject('d1', { title: 'Errors' })], PER_PAGE * 6);

      const result = await run({ page: 6 });

      expect(result).toEqual(expect.objectContaining({ page: 6, totalPages: 6 }));
      expect(result.message).toContain('page 6 of 6');
    });

    it('reports a single page when everything fits', async () => {
      resolveWith([savedObject('d1', { title: 'Errors' })]);

      const result = await run();

      expect(result).toEqual(expect.objectContaining({ totalPages: 1 }));
      expect(result.message).toContain('page 1 of 1');
    });

    it('reports one page rather than zero for an empty installation', async () => {
      const result = await run();

      expect(result).toEqual(expect.objectContaining({ totalDashboardsCount: 0, totalPages: 1 }));
    });
  });

  it('reports a failed lookup to the agent instead of throwing', async () => {
    find.mockRejectedValue(new Error('saved objects unavailable'));

    await expect(run()).resolves.toEqual(
      expect.objectContaining({ success: false, error: 'saved objects unavailable' })
    );
  });

  it('surfaces the response body reason rather than the bare HTTP status', async () => {
    const httpError = Object.assign(new Error('Bad Request'), {
      body: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Result window is too large, from + size must be less than or equal to: [10000]',
      },
    });
    find.mockRejectedValue(httpError);

    const result = await run({ page: 999 });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Result window is too large');
  });

  it.each([
    ['a string', 'boom'],
    ['null', null],
    ['undefined', undefined],
  ])('reports %s as a rejection reason without leaking undefined', async (_label, reason) => {
    find.mockRejectedValue(reason);

    await expect(run()).resolves.toEqual(
      expect.objectContaining({ success: false, error: 'Unknown error' })
    );
  });
});
