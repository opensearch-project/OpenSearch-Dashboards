/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent, waitFor, screen, within } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { workspaceClientMock } from '../../../public/workspace_client.mock';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import {
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
  DATA_SOURCE_SAVED_OBJECT_TYPE,
} from '../../../../data_source/common';
import { AssetMigrationModal, AssetMigrationModalProps } from './asset_migration_modal';
import { MIGRATION_PAGE_SIZE } from './types';
import { getDataSourcesList } from '../../utils';

// The modal resolves data source / data connection ids through `getDataSourcesList`. Mocking only
// that export keeps the modal state machine under test while the rest of the (large) utils module --
// including the real `findUnassignedAssets` / `countUnassignedAssets` the modal and review step rely
// on -- keeps its actual implementation, so the find request contract is exercised for real.
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  getDataSourcesList: jest.fn(),
}));

const getDataSourcesListMock = getDataSourcesList as jest.Mock;
const coreStartMock = coreMock.createStart();
const savedObjectsFindMock = coreStartMock.savedObjects.client.find as jest.Mock;

const MIGRATABLE_TYPES = ['dashboard', 'visualization', 'search'];

// Two data sources + one data connection => a stable `dataSourceCount` of 3 in the summary.
const dataSourceList = [
  { id: 'ds-1', type: DATA_SOURCE_SAVED_OBJECT_TYPE, title: 'Data source 1' },
  { id: 'ds-2', type: DATA_SOURCE_SAVED_OBJECT_TYPE, title: 'Data source 2' },
  { id: 'dc-1', type: DATA_CONNECTION_SAVED_OBJECT_TYPE, title: 'Data connection 1' },
];

interface Asset {
  id: string;
  type: string;
  title: string;
}

const toSavedObject = (asset: Asset) => ({
  id: asset.id,
  type: asset.type,
  get: (field: string) => (field === 'title' ? asset.title : undefined),
});

/**
 * A faithful stand-in for the unassigned result set the server pages through. The migration loop
 * re-fetches the same page after a successful round because a success removes the asset from the
 * set; modelling that removal here is what lets a single fixture drive the loop's real termination
 * behaviour instead of a hand-scripted sequence of responses that could diverge from it.
 */
const createStore = (initial: Asset[]) => {
  let assets = initial.map((asset) => ({ ...asset }));
  return {
    size: () => assets.length,
    page: (page: number, perPage: number) =>
      assets.slice((page - 1) * perPage, (page - 1) * perPage + perPage),
    remove: (id: string, type: string) => {
      assets = assets.filter((asset) => !(asset.id === id && asset.type === type));
    },
  };
};

type Store = ReturnType<typeof createStore>;

const wireFind = (store: Store) => {
  savedObjectsFindMock.mockImplementation((options: { perPage: number; page?: number }) => {
    // `perPage: 0` is the count query (progress denominator and per-type breakdown); it must report
    // the live remaining size so a retry's denominator reflects what is actually left.
    if (options.perPage === 0) {
      return Promise.resolve({ total: store.size(), savedObjects: [] });
    }
    const items = store.page(options.page ?? 1, options.perPage);
    return Promise.resolve({ total: store.size(), savedObjects: items.map(toSavedObject) });
  });
};

/** Every associated id succeeds and leaves the set, as a clean server round would. */
const associateAllSuccess = (store: Store) =>
  jest.fn(async (items: Asset[]) => {
    items.forEach((item) => store.remove(item.id, item.type));
    return { success: true, result: items.map(({ id, type }) => ({ id, type })) };
  });

/** Ids in `failingIds` come back with an error and stay unassigned; the rest succeed and leave. */
const associateFailing = (failingIds: Set<string>) => (store: Store) =>
  jest.fn(async (items: Asset[]) => ({
    success: true,
    result: items.map(({ id, type }) => {
      if (failingIds.has(id)) {
        return { id, type, error: `cannot migrate ${id}` };
      }
      store.remove(id, type);
      return { id, type };
    }),
  }));

const bulkAssets = (count: number, prefix: string, type = 'dashboard'): Asset[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${String(index).padStart(3, '0')}`,
    type,
    title: `${prefix} ${index}`,
  }));

const idsOf = (items: Asset[]) => items.map((item) => item.id);

const renderModal = ({
  initialAssets = [],
  create,
  buildAssociate = associateAllSuccess,
  existingWorkspaceNames = ['Existing WS'],
  migratableTypes = MIGRATABLE_TYPES,
  onClose = jest.fn(),
}: {
  initialAssets?: Asset[];
  create?: jest.Mock;
  buildAssociate?: (store: Store) => jest.Mock;
  existingWorkspaceNames?: string[];
  migratableTypes?: string[];
  onClose?: jest.Mock;
} = {}) => {
  const store = createStore(initialAssets);
  wireFind(store);
  const workspaceClient = {
    ...workspaceClientMock,
    create: create ?? jest.fn().mockResolvedValue({ success: true, result: { id: 'ws-123' } }),
    associate: buildAssociate(store),
  };
  const services = { ...coreStartMock, workspaceClient };
  const props: AssetMigrationModalProps = { migratableTypes, existingWorkspaceNames, onClose };
  const utils = render(
    <OpenSearchDashboardsContextProvider services={services}>
      <AssetMigrationModal {...props} />
    </OpenSearchDashboardsContextProvider>
  );
  return { ...utils, store, workspaceClient, onClose };
};

const migratedStatValue = () =>
  within(screen.getByText('Assets migrated').closest<HTMLElement>('.euiStat')!);
const failedStatValue = () => within(screen.getByText('Failed').closest<HTMLElement>('.euiStat')!);

describe('AssetMigrationModal', () => {
  beforeEach(() => {
    getDataSourcesListMock.mockResolvedValue(dataSourceList);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the review phase and dismissing from it reports no result so the caller does not refetch', () => {
    const { getByTestId, onClose } = renderModal();

    expect(getByTestId('assetMigrationReviewTable')).toBeInTheDocument();
    expect(getByTestId('assetMigrationConfirmButton')).toHaveTextContent(
      'Create workspace and migrate'
    );
    expect(screen.queryByTestId('assetMigrationRunningStep')).not.toBeInTheDocument();

    // No run happened, so the listing the caller holds is still valid: closing must signal nothing.
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledWith(undefined);
  });

  it('rejects a blank name inline and never creates a workspace', () => {
    const { getByTestId, workspaceClient } = renderModal();

    fireEvent.change(getByTestId('assetMigrationWorkspaceName'), { target: { value: '   ' } });
    fireEvent.click(getByTestId('assetMigrationConfirmButton'));

    expect(screen.getByText("Name can't be empty or blank.")).toBeInTheDocument();
    expect(getByTestId('assetMigrationReviewTable')).toBeInTheDocument();
    expect(screen.queryByTestId('assetMigrationRunningStep')).not.toBeInTheDocument();
    expect(workspaceClient.create).not.toHaveBeenCalled();
    expect(workspaceClient.associate).not.toHaveBeenCalled();
  });

  it('disables confirm on a duplicate name (case-insensitive, trimmed) so nothing is submitted', () => {
    const { getByTestId, workspaceClient } = renderModal({
      existingWorkspaceNames: ['Existing WS'],
    });

    fireEvent.change(getByTestId('assetMigrationWorkspaceName'), {
      target: { value: '  existing ws  ' },
    });

    expect(
      screen.getByText('A workspace with this name already exists. Enter a different name.')
    ).toBeInTheDocument();
    const confirmButton = getByTestId('assetMigrationConfirmButton');
    expect(confirmButton).toBeDisabled();

    fireEvent.click(confirmButton);
    expect(workspaceClient.create).not.toHaveBeenCalled();
    expect(workspaceClient.associate).not.toHaveBeenCalled();
  });

  it('happy path: walks every page, associating one bounded page at a time, and totals them', async () => {
    // Sized off the real page size so the fixture keeps spanning exactly one full page plus a short
    // one however the page size is tuned -- hard-coding a total silently stops testing the paging.
    const shortPage = 3;
    const initialAssets = bulkAssets(MIGRATION_PAGE_SIZE + shortPage, 'asset');
    const { getByTestId, workspaceClient } = renderModal({ initialAssets });

    fireEvent.change(getByTestId('assetMigrationWorkspaceName'), {
      target: { value: '  My Migrated WS  ' },
    });
    fireEvent.click(getByTestId('assetMigrationConfirmButton'));

    // Running phase is visible before the async walk settles.
    expect(getByTestId('assetMigrationRunningStep')).toBeInTheDocument();

    await waitFor(() =>
      expect(getByTestId('assetMigrationOpenWorkspaceButton')).toBeInTheDocument()
    );

    // One associate call per page, each carrying only that page's ids -- never the whole set.
    expect(workspaceClient.associate).toHaveBeenCalledTimes(2);
    expect(workspaceClient.associate.mock.calls[0][0]).toHaveLength(MIGRATION_PAGE_SIZE);
    expect(idsOf(workspaceClient.associate.mock.calls[0][0])).toEqual(
      idsOf(initialAssets.slice(0, MIGRATION_PAGE_SIZE))
    );
    expect(idsOf(workspaceClient.associate.mock.calls[1][0])).toEqual(
      idsOf(initialAssets.slice(MIGRATION_PAGE_SIZE))
    );

    // The summary sums the pages, and create ran exactly once with the trimmed name + resolved ids.
    expect(migratedStatValue().getByText(String(initialAssets.length))).toBeInTheDocument();
    expect(failedStatValue().getByText('0')).toBeInTheDocument();
    expect(workspaceClient.create).toHaveBeenCalledTimes(1);
    expect(workspaceClient.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Migrated WS' }),
      expect.objectContaining({ dataSources: ['ds-1', 'ds-2'], dataConnections: ['dc-1'] })
    );
  });

  it('partial failure: failures list holds only the failed ids and the counts are exact', async () => {
    const initialAssets: Asset[] = [
      { id: 'a1', type: 'dashboard', title: 'Dashboard One' },
      { id: 'a2', type: 'visualization', title: 'Viz Two' },
      { id: 'a3', type: 'search', title: 'Search Three' },
    ];
    const { getByTestId, workspaceClient } = renderModal({
      initialAssets,
      buildAssociate: associateFailing(new Set(['a1'])),
    });

    fireEvent.click(getByTestId('assetMigrationConfirmButton'));

    await waitFor(() => expect(getByTestId('assetMigrationResultTable')).toBeInTheDocument());

    expect(migratedStatValue().getByText('2')).toBeInTheDocument();
    expect(failedStatValue().getByText('1')).toBeInTheDocument();

    // Only the failed asset is listed; the two successes carry no row.
    const failureTable = getByTestId('assetMigrationResultTable');
    expect(within(failureTable).getByText('Dashboard One')).toBeInTheDocument();
    expect(within(failureTable).queryByText('Viz Two')).not.toBeInTheDocument();
    expect(within(failureTable).queryByText('Search Three')).not.toBeInTheDocument();

    // The failing id is never resubmitted within the same run.
    const failedSubmissions = workspaceClient.associate.mock.calls.filter((call: Asset[][]) =>
      idsOf(call[0]).includes('a1')
    );
    expect(failedSubmissions).toHaveLength(1);
  });

  it('a permanently failing asset terminates the run and is reported once, not retried forever', async () => {
    const initialAssets: Asset[] = [{ id: 'fx', type: 'dashboard', title: 'Stuck Asset' }];
    const { getByTestId, workspaceClient } = renderModal({
      initialAssets,
      buildAssociate: associateFailing(new Set(['fx'])),
    });

    fireEvent.click(getByTestId('assetMigrationConfirmButton'));

    // Reaching the result phase at all is the termination proof: a naive loop would re-submit the
    // asset that never leaves the unassigned set and never finish.
    await waitFor(() => expect(getByTestId('assetMigrationResultTable')).toBeInTheDocument());

    expect(workspaceClient.associate).toHaveBeenCalledTimes(1);
    expect(idsOf(workspaceClient.associate.mock.calls[0][0])).toEqual(['fx']);
    expect(migratedStatValue().getByText('0')).toBeInTheDocument();
    expect(failedStatValue().getByText('1')).toBeInTheDocument();
    expect(
      within(getByTestId('assetMigrationResultTable')).getByText('Stuck Asset')
    ).toBeInTheDocument();
  });

  it('advances past a page that is entirely already-attempted instead of concluding it is done', async () => {
    // A full page of permanently-stuck assets occupies page 1, pushing the migratable ones onto page
    // 2. The loop must step past the stuck page rather than read an all-attempted page as "nothing
    // left". Sized off the real page size so the stuck set keeps filling exactly one page.
    const stuck = bulkAssets(MIGRATION_PAGE_SIZE, 'stuck');
    const onPageTwo: Asset[] = [
      { id: 'fresh-a', type: 'visualization', title: 'Fresh A' },
      { id: 'fresh-b', type: 'visualization', title: 'Fresh B' },
      { id: 'fresh-c', type: 'search', title: 'Fresh C' },
    ];
    const { getByTestId, workspaceClient } = renderModal({
      initialAssets: [...stuck, ...onPageTwo],
      buildAssociate: associateFailing(new Set(idsOf(stuck))),
    });

    fireEvent.click(getByTestId('assetMigrationConfirmButton'));

    await waitFor(() =>
      expect(getByTestId('assetMigrationOpenWorkspaceButton')).toBeInTheDocument()
    );

    // The page-2 assets were reached and migrated despite page 1 being all-stuck.
    expect(workspaceClient.associate).toHaveBeenCalledTimes(2);
    expect(idsOf(workspaceClient.associate.mock.calls[0][0])).toEqual(idsOf(stuck));
    expect(idsOf(workspaceClient.associate.mock.calls[1][0])).toEqual(idsOf(onPageTwo));
    expect(migratedStatValue().getByText(String(onPageTwo.length))).toBeInTheDocument();
    expect(failedStatValue().getByText(String(stuck.length))).toBeInTheDocument();
  });

  it('retry from the result view reuses the workspace and carries the earlier associated count', async () => {
    const initialAssets: Asset[] = [
      { id: 'a1', type: 'dashboard', title: 'Dashboard One' },
      { id: 'a2', type: 'visualization', title: 'Viz Two' },
      { id: 'a3', type: 'search', title: 'Search Three' },
    ];
    // `a1` fails only on its first attempt, so the retry can succeed it.
    const create = jest.fn().mockResolvedValue({ success: true, result: { id: 'ws-123' } });
    let a1Attempts = 0;
    const buildAssociate = (store: Store) =>
      jest.fn(async (items: Asset[]) => ({
        success: true,
        result: items.map(({ id, type }) => {
          if (id === 'a1' && (a1Attempts += 1) === 1) {
            return { id, type, error: 'transient' };
          }
          store.remove(id, type);
          return { id, type };
        }),
      }));
    const onClose = jest.fn();
    const { getByTestId, workspaceClient } = renderModal({
      initialAssets,
      create,
      buildAssociate,
      onClose,
    });

    fireEvent.click(getByTestId('assetMigrationConfirmButton'));
    await waitFor(() => expect(getByTestId('assetMigrationRetryFailedButton')).toBeInTheDocument());

    fireEvent.click(getByTestId('assetMigrationRetryFailedButton'));

    await waitFor(() => expect(migratedStatValue().getByText('3')).toBeInTheDocument());
    expect(failedStatValue().getByText('0')).toBeInTheDocument();

    // create ran once total; the retry resubmitted only the still-unassigned id, same workspace.
    expect(create).toHaveBeenCalledTimes(1);
    expect(workspaceClient.associate).toHaveBeenCalledTimes(2);
    expect(workspaceClient.associate.mock.calls[1][0]).toEqual([{ id: 'a1', type: 'dashboard' }]);
    expect(workspaceClient.associate.mock.calls[1][1]).toBe('ws-123');

    // The merged associated count (2 carried + 1 new) reaches the close payload.
    fireEvent.click(getByTestId('assetMigrationCloseButton'));
    expect(onClose).toHaveBeenCalledWith({ migratedAssets: 3 });
  });

  it('surfaces a create failure on the name field and returns to review without a toast', async () => {
    const create = jest
      .fn()
      .mockResolvedValue({ success: false, error: 'Server rejected the name' });
    const { getByTestId, workspaceClient } = renderModal({
      initialAssets: [{ id: 'a1', type: 'dashboard', title: 'Dashboard One' }],
      create,
    });

    fireEvent.click(getByTestId('assetMigrationConfirmButton'));

    await waitFor(() => expect(screen.getByText('Server rejected the name')).toBeInTheDocument());
    expect(getByTestId('assetMigrationReviewTable')).toBeInTheDocument();
    expect(workspaceClient.associate).not.toHaveBeenCalled();
    expect(coreStartMock.notifications.toasts.addDanger).not.toHaveBeenCalled();
  });

  /**
   * An interrupted walk still moved whatever it moved, so it reports a real outcome instead of an
   * error: the assets it associated stay associated, and the ones it never reached are still
   * unassigned and still migratable.
   */
  it('reports an interrupted walk on the result view rather than discarding it', async () => {
    const buildAssociate = () => jest.fn().mockRejectedValue(new Error('associate exploded'));
    const { getByTestId } = renderModal({
      initialAssets: [{ id: 'a1', type: 'dashboard', title: 'Dashboard One' }],
      buildAssociate,
    });

    fireEvent.click(getByTestId('assetMigrationConfirmButton'));

    await waitFor(() => expect(getByTestId('assetMigrationStopped')).toBeInTheDocument());
    expect(screen.getByText('associate exploded')).toBeInTheDocument();
    // A stop is not an error the user has to dismiss, and it must not read as a fresh start.
    expect(coreStartMock.notifications.toasts.addDanger).not.toHaveBeenCalled();
    expect(screen.queryByTestId('assetMigrationWorkspaceName')).not.toBeInTheDocument();
    // Nothing was associated, so the run offers to continue rather than claiming success.
    expect(getByTestId('assetMigrationRetryFailedButton')).toHaveTextContent('Continue migrating');
  });

  it('refuses dismissal mid-run, explaining why instead of closing', async () => {
    // A create that never settles pins the wizard in the running phase for the interaction.
    const create = jest.fn(() => new Promise(() => {}));
    const { getByTestId, onClose } = renderModal({
      initialAssets: [{ id: 'a1', type: 'dashboard', title: 'Dashboard One' }],
      create,
    });

    fireEvent.click(getByTestId('assetMigrationConfirmButton'));
    expect(getByTestId('assetMigrationRunningStep')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Closes this modal window'));

    await waitFor(() => expect(getByTestId('assetMigrationDismissBlocked')).toBeInTheDocument());
    // Dismissal was refused: the caller was never told to close.
    expect(onClose).not.toHaveBeenCalled();
    expect(getByTestId('assetMigrationRunningStep')).toBeInTheDocument();
  });
});
