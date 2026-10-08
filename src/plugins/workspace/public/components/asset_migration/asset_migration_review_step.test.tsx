/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import {
  AssetMigrationReviewStep,
  AssetMigrationReviewStepProps,
} from './asset_migration_review_step';
import { CreatedWorkspace } from './types';

const EXPLAIN_TITLE =
  'These assets are not assigned to any workspace, so they are hidden from workspace views';
const EXPLAIN_BODY =
  'They were created before workspaces were enabled and still exist. Moving them into a workspace makes them visible again. Every unassigned asset is migrated, not only the ones shown below, and all data sources are connected to the new workspace so migrated dashboards keep rendering.';
const FILTER_HINT = 'Search only changes what is listed here. Every asset is migrated regardless.';

const MIGRATABLE_TYPES = ['visualization', 'dashboard', 'search'];

interface AssetSpec {
  id?: string;
  type?: string;
  title?: string;
}

const buildPage = (specs: AssetSpec[]) =>
  specs.map((spec, index) => ({
    id: spec.id ?? `id-${index}`,
    type: spec.type ?? 'visualization',
    title: spec.title ?? `asset-${index}`,
  }));

// Mirrors the saved object shape `findUnassignedAssets` reads: it maps `savedObject.get('title')`.
const savedObjectFor = (asset: { id: string; type: string; title: string }) => ({
  id: asset.id,
  type: asset.type,
  get: (field: string) => (field === 'title' ? asset.title : undefined),
});

interface FindScenario {
  unassignedTotal?: number;
  page?: { total: number; assets: Array<{ id: string; type: string; title: string }> };
  pageError?: unknown;
}

/**
 * One `find` stands in for both server calls the step makes: a single `perPage: 0` count over every
 * migratable type, and the table page fetch at the real page size. Splitting on `perPage` lets one
 * mock feed the two independently, which is exactly what the migrate-all invariant needs -- the count
 * and the visible page can be made to disagree.
 */
const makeFind = ({
  unassignedTotal = 0,
  page = { total: 0, assets: [] },
  pageError,
}: FindScenario = {}) =>
  jest.fn((options: any) => {
    if (options.perPage === 0) {
      return Promise.resolve({ total: unassignedTotal, savedObjects: [] });
    }
    if (pageError) {
      return Promise.reject(pageError);
    }
    return Promise.resolve({ total: page.total, savedObjects: page.assets.map(savedObjectFor) });
  });

const DEFAULT_SCENARIO: FindScenario = {
  unassignedTotal: 1,
  page: { total: 1, assets: buildPage([{ type: 'visualization', title: 'Loaded row' }]) },
};

const renderStep = (
  overrides: Partial<AssetMigrationReviewStepProps> = {},
  find = makeFind(DEFAULT_SCENARIO)
) => {
  const coreStartMock = coreMock.createStart();
  coreStartMock.savedObjects.client.find = find as any;
  const onWorkspaceNameChange = jest.fn();
  const props: AssetMigrationReviewStepProps = {
    migratableTypes: overrides.migratableTypes ?? MIGRATABLE_TYPES,
    workspaceName: overrides.workspaceName ?? '',
    onWorkspaceNameChange,
    nameError: overrides.nameError,
    createdWorkspace: overrides.createdWorkspace,
  };
  const utils = render(
    <OpenSearchDashboardsContextProvider services={coreStartMock as any}>
      <AssetMigrationReviewStep {...props} />
    </OpenSearchDashboardsContextProvider>
  );
  return { onWorkspaceNameChange, find, ...utils };
};

const pageFetches = (find: jest.Mock) => find.mock.calls.filter((call) => call[0].perPage !== 0);

// Lets the mounted effects (debounced page fetch + unassigned count) settle before a test ends, so
// their state writes happen inside `act` rather than after the component is torn down.
const waitForFirstPage = () => screen.findByText('Loaded row');

describe('AssetMigrationReviewStep', () => {
  it('renders the explanatory callout title and body', async () => {
    renderStep();
    expect(screen.getByText(EXPLAIN_TITLE)).toBeInTheDocument();
    expect(screen.getByText(EXPLAIN_BODY)).toBeInTheDocument();
    await waitForFirstPage();
  });

  it('shows the current workspaceName in the name field and reports typed changes', async () => {
    const { onWorkspaceNameChange } = renderStep({ workspaceName: 'My name' });
    const field = screen.getByTestId('assetMigrationWorkspaceName');
    expect(field).toHaveValue('My name');

    fireEvent.change(field, { target: { value: 'Migrated assets' } });
    expect(onWorkspaceNameChange).toHaveBeenCalledWith('Migrated assets');
    await waitForFirstPage();
  });

  it('marks the name field invalid and shows the inline error when nameError is passed', async () => {
    renderStep({ nameError: 'Name is required' });
    // The message is a form-row error, which EuiFormRow only renders when the row is invalid.
    const errorNode = screen.getByText('Name is required');
    expect(errorNode.closest('.euiFormErrorText')).not.toBeNull();
    await waitForFirstPage();
  });

  it('locks the name field to the created workspace and shows the already-created help text', async () => {
    const createdWorkspace: CreatedWorkspace = {
      id: 'ws-1',
      name: 'Existing workspace',
      dataSourceCount: 2,
    };
    renderStep({ workspaceName: 'ignored typed value', createdWorkspace });

    const field = screen.getByTestId('assetMigrationWorkspaceName');
    expect(field).toBeDisabled();
    // The locked field shows the created workspace name, never the (stale) typed value behind it.
    expect(field).toHaveValue('Existing workspace');
    expect(
      screen.getByText(
        'This workspace was already created. Retrying migrates into it rather than creating another one.'
      )
    ).toBeInTheDocument();
    await waitForFirstPage();
  });

  /**
   * The invariant this whole step is built around: the "will be migrated" figure comes from an
   * unfiltered count, not from the table page. Here the count reports 25 while the page reports 2 --
   * as it would under an active search -- so an implementation that read the page would understate the
   * migration as 2. Asserting 25 (and the absence of 2) locks that the summary can never shrink with
   * the view.
   */
  it('takes the migrate-all figure from the unfiltered count, not the table page', async () => {
    renderStep(
      {},
      makeFind({
        unassignedTotal: 25,
        page: {
          total: 2,
          assets: buildPage([
            { type: 'visualization', title: 'Viz A' },
            { type: 'dashboard', title: 'Dash A' },
          ]),
        },
      })
    );

    // Wait for the debounced page fetch to land its 2 rows before comparing against the summary.
    const table = screen.getByTestId('assetMigrationReviewTable');
    expect(await within(table).findByText('Viz A')).toBeInTheDocument();
    expect(within(table).getByText('Dash A')).toBeInTheDocument();

    // The summary counts every unassigned asset (25), not the 2 rows the page actually returned.
    expect(screen.getByText('All 25 assets will be migrated:')).toBeInTheDocument();
    expect(screen.queryByText('All 2 assets will be migrated:')).not.toBeInTheDocument();
  });

  /**
   * Opening the wizard must cost exactly one count plus one page. This is what the absent type facet
   * buys: establishing which types have assets would have needed a count per type, and no aggregation
   * API exists to fold those into one request.
   */
  it('costs exactly one count and one page fetch on open', async () => {
    const { find } = renderStep();
    await waitForFirstPage();

    const countCalls = find.mock.calls.filter(([options]: [any]) => options.perPage === 0);
    expect(countCalls).toHaveLength(1);
    expect(countCalls[0][0].type).toEqual(MIGRATABLE_TYPES);
    expect(pageFetches(find)).toHaveLength(1);
  });

  it('shows the note that search and filter do not narrow what gets migrated', async () => {
    renderStep();
    expect(screen.getByText(FILTER_HINT)).toBeInTheDocument();
    await waitForFirstPage();
  });

  it('issues a fresh find carrying the new page and perPage when the table page changes', async () => {
    const { find } = renderStep(
      {},
      makeFind({
        unassignedTotal: 25,
        page: { total: 25, assets: buildPage([{ title: 'Row A' }]) },
      })
    );

    await waitFor(() => expect(pageFetches(find).length).toBeGreaterThan(0));
    const firstPage = pageFetches(find)[0][0];
    expect(firstPage.page).toBe(1);
    expect(firstPage.perPage).toBe(10);

    fireEvent.click(screen.getByTestId('pagination-button-next'));

    await waitFor(() => {
      const latest = pageFetches(find).slice(-1)[0][0];
      expect(latest.page).toBe(2);
      expect(latest.perPage).toBe(10);
    });
  });

  /**
   * Pressing Enter is what commits a search box value into a request. `fireEvent.change` alone does
   * not raise the field's `search` event that `onSearch` listens for, so Enter is simulated explicitly.
   */
  it('commits the typed text into a find carrying the search term when Enter is pressed', async () => {
    const { find } = renderStep(
      {},
      makeFind({
        unassignedTotal: 5,
        page: { total: 5, assets: buildPage([{ title: 'Row A' }]) },
      })
    );

    await waitFor(() => expect(pageFetches(find).length).toBeGreaterThan(0));
    const searchBox = screen.getByTestId('assetMigrationSearchBar');
    fireEvent.change(searchBox, { target: { value: 'sales' } });
    fireEvent.keyUp(searchBox, { key: 'Enter', keyCode: 13 });

    await waitFor(() => {
      const searchCall = find.mock.calls.find((call) => call[0].search === 'sales*');
      expect(searchCall).toBeTruthy();
      expect(searchCall![0].searchFields).toEqual(['title']);
    });
  });

  /**
   * The search box is a plain keyword field now, not a query language: `type:dashboard` is just text
   * matched against the title, never parsed into a type filter.
   */
  it('treats a colon in the search text as a literal keyword, not a type filter', async () => {
    const { find } = renderStep(
      {},
      makeFind({
        unassignedTotal: 5,
        page: { total: 5, assets: buildPage([{ title: 'Row A' }]) },
      })
    );

    await waitFor(() => expect(pageFetches(find).length).toBeGreaterThan(0));
    const searchBox = screen.getByTestId('assetMigrationSearchBar');
    fireEvent.change(searchBox, { target: { value: 'type:dashboard' } });
    fireEvent.keyUp(searchBox, { key: 'Enter', keyCode: 13 });

    await waitFor(() => {
      const latest = pageFetches(find).slice(-1)[0][0];
      expect(latest.search).toBe('type:dashboard*');
      // The request's type list is always every migratable type; nothing derives from the search text.
      expect(latest.type).toEqual(MIGRATABLE_TYPES);
    });
  });

  /**
   * A failed lookup must reach the table's error state. Falling back to an empty table would read as
   * "nothing to migrate" -- the exact false conclusion this flow exists to prevent.
   */
  it('surfaces a find failure through the table error state, not as an empty table', async () => {
    renderStep(
      {},
      makeFind({
        unassignedTotal: 3,
        pageError: { body: { message: 'find exploded' } },
      })
    );

    expect(await screen.findByText('find exploded')).toBeInTheDocument();
    // The empty-state copy must not be what the user sees when the fetch actually failed.
    expect(screen.queryByText('No assets match this search.')).not.toBeInTheDocument();
  });

  it('shows the empty-result message when the page comes back with no assets', async () => {
    renderStep({}, makeFind({ unassignedTotal: 4, page: { total: 0, assets: [] } }));
    expect(await screen.findByText('No assets match this search.')).toBeInTheDocument();
  });
});
