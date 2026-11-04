/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createMemoryHistory } from 'history';
import { checkForDuplicateTitle } from '../../../../saved_objects/public';
import { SAVE_DUPLICATE_REJECTED } from '../../../../saved_objects/public/constants';
import { saveNewDashboard } from './save_new_dashboard';
import { copyDashboardPanels } from './copy_dashboard_panels';

jest.mock('../../../../saved_objects/public', () => ({
  ...jest.requireActual('../../../../saved_objects/public'),
  checkForDuplicateTitle: jest.fn(async () => true),
}));
jest.mock('./copy_dashboard_panels', () => ({
  ...jest.requireActual('./copy_dashboard_panels'),
  copyDashboardPanels: jest.fn(),
}));

const panels = [{ panelIndex: '1', id: 'a', type: 'visualization' }] as any;

const setup = (draftSave = jest.fn(async () => 'new-id')) => {
  const draft: any = {
    save: draftSave,
    getOpenSearchType: () => 'dashboard',
    getDisplayName: () => 'dashboard',
    searchSource: { setField: jest.fn() },
  };
  const source: any = {
    searchSource: {
      getFields: () => ({
        highlightAll: true,
        version: true,
        filter: [{ meta: { key: 'old' } }],
        query: { query: 'old', language: 'kuery' },
      }),
    },
  };
  const state = {
    title: 'Source',
    description: 'desc',
    timeRestore: false,
    panels,
    options: {},
    filters: [],
    query: { query: '', language: 'kuery' },
  };
  const stateContainer: any = { getState: () => state };
  const history = createMemoryHistory({
    initialEntries: ['/view/source?_g=(time:(from:now-1d))&_a=(panels:!())'],
  });
  const services: any = {
    savedDashboards: { get: jest.fn(async () => draft) },
    savedObjects: { client: {} },
    overlays: {},
    chrome: { docTitle: { change: jest.fn() } },
    notifications: {
      toasts: { addSuccess: jest.fn(), addDanger: jest.fn(), addWarning: jest.fn() },
    },
    data: {
      query: {
        timefilter: {
          timefilter: {
            getTime: () => ({ from: '2024-01-01T00:00:00.000Z', to: '2024-01-02T00:00:00.000Z' }),
            getRefreshInterval: () => ({ pause: true, value: 0 }),
          },
        },
      },
    },
    history,
  };
  return { draft, state, stateContainer, source, services, history };
};

const saveOptions = { isTitleDuplicateConfirmed: false, onTitleDuplicate: jest.fn() };

beforeEach(() => jest.clearAllMocks());

it('saves a new dashboard from the current state and opens it without _a', async () => {
  const { draft, stateContainer, source, services, history, state } = setup();
  const result = await saveNewDashboard(
    { title: 'New', description: 'd2', saveOptions },
    stateContainer,
    source,
    services
  );

  expect(result).toEqual({ id: 'new-id' });
  expect(draft).toMatchObject({ title: 'New', description: 'd2', timeRestore: false });
  expect(JSON.parse(draft.panelsJSON)).toEqual(panels);
  expect(draft.save).toHaveBeenCalledWith({
    confirmOverwrite: false,
    isTitleDuplicateConfirmed: true,
  });
  expect(copyDashboardPanels).not.toHaveBeenCalled();
  expect(state.title).toBe('Source');
  expect(history.location.pathname).toBe('/view/new-id');
  expect(history.location.search).toContain('_g=');
  expect(history.location.search).not.toContain('_a=');
});

it('copies every saved field from the source state', async () => {
  const { draft, stateContainer, source, services } = setup();
  const filters = [
    { meta: { key: 'a' } },
    { meta: { key: 'pinned' }, $state: { store: 'globalState' } },
  ];
  const state = {
    ...stateContainer.getState(),
    timeRestore: true,
    options: { useMargins: false },
    variables: [{ name: 'v' }],
    layout: { type: 'SectionLayout', items: [{ id: 's1' }] },
    filters,
    query: { query: 'x', language: 'kuery' },
  };
  await saveNewDashboard(
    { title: 'New', saveOptions },
    { getState: () => state } as any,
    source,
    services
  );

  expect(draft).toMatchObject({
    title: 'New',
    description: 'desc',
    timeRestore: true,
    timeFrom: '2024-01-01T00:00:00.000Z',
    timeTo: '2024-01-02T00:00:00.000Z',
    refreshInterval: { pause: true, value: 0 },
  });
  expect(JSON.parse(draft.panelsJSON)).toEqual(panels);
  expect(JSON.parse(draft.optionsJSON)).toEqual({ useMargins: false });
  expect(JSON.parse(draft.variablesJSON)).toEqual({ variables: [{ name: 'v' }] });
  expect(JSON.parse(draft.layoutJSON)).toEqual(state.layout);
  const fields = Object.fromEntries(draft.searchSource.setField.mock.calls);
  expect(fields).toEqual({
    highlightAll: true,
    version: true,
    filter: [filters[0]],
    query: state.query,
  });
});

it('keeps the modal open on a duplicate title, before copying anything', async () => {
  (checkForDuplicateTitle as jest.Mock).mockRejectedValueOnce(new Error(SAVE_DUPLICATE_REJECTED));
  const { draft, stateContainer, source, services } = setup();
  const result = await saveNewDashboard(
    { title: 'New', copyPanels: { titleTemplate: 'x' }, saveOptions },
    stateContainer,
    source,
    services
  );

  expect(result).toEqual({ id: '' });
  expect(copyDashboardPanels).not.toHaveBeenCalled();
  expect(draft.save).not.toHaveBeenCalled();
});

it('saves the copied panels and warns about panels that were not copied', async () => {
  const copied = [{ ...panels[0], id: 'copy' }];
  (copyDashboardPanels as jest.Mock).mockResolvedValueOnce({
    panels: copied,
    failures: ['Other'],
  });
  const { draft, stateContainer, source, services } = setup();
  await saveNewDashboard(
    { title: 'New', copyPanels: { titleTemplate: 'x' }, saveOptions },
    stateContainer,
    source,
    services
  );

  expect(copyDashboardPanels).toHaveBeenCalledWith({}, panels, {
    titleTemplate: 'x',
    dashboardTitle: 'New',
    signal: undefined,
    onCopied: expect.any(Function),
  });
  expect(JSON.parse(draft.panelsJSON)).toEqual(copied);
  expect(services.notifications.toasts.addWarning).toHaveBeenCalled();
});

it('reports a failed save', async () => {
  (copyDashboardPanels as jest.Mock).mockImplementationOnce(async (_c, _p, { onCopied }) => {
    onCopied();
    return { panels, failures: [] };
  });
  const { stateContainer, source, services } = setup(
    jest.fn().mockRejectedValue(new Error('boom'))
  );
  const result = await saveNewDashboard(
    { title: 'New', copyPanels: { titleTemplate: 'x' }, saveOptions },
    stateContainer,
    source,
    services
  );

  expect(result).toEqual({ error: expect.any(Error) });
  expect(services.notifications.toasts.addDanger).toHaveBeenCalledWith(
    expect.objectContaining({ text: 'Panels that were already copied are kept.' })
  );
});

it('reports a failed save after a late cancel without closing the modal again', async () => {
  const controller = new AbortController();
  const { stateContainer, source, services } = setup(
    jest.fn(async () => {
      controller.abort();
      throw new Error('boom');
    })
  );
  const result = await saveNewDashboard(
    { title: 'New', saveOptions, signal: controller.signal },
    stateContainer,
    source,
    services
  );

  expect(result).toEqual({});
  const toast = services.notifications.toasts.addDanger.mock.calls[0][0];
  expect(toast.text).toBeUndefined(); // no copy was made
});

it('does not say copies were kept when copying failed before any copy', async () => {
  (copyDashboardPanels as jest.Mock).mockRejectedValueOnce(new Error('bulkGet failed'));
  const { stateContainer, source, services } = setup();
  const result = await saveNewDashboard(
    { title: 'New', copyPanels: { titleTemplate: 'x' }, saveOptions },
    stateContainer,
    source,
    services
  );

  expect(result).toEqual({ error: expect.any(Error) });
  expect(services.notifications.toasts.addDanger.mock.calls[0][0].text).toBeUndefined();
});

it('reports a non-Error rejection as an error', async () => {
  const { stateContainer, source, services } = setup(jest.fn().mockRejectedValue('boom'));
  const result = await saveNewDashboard(
    { title: 'New', saveOptions },
    stateContainer,
    source,
    services
  );

  expect(result).toEqual({ error: new Error('boom') });
  expect(services.notifications.toasts.addDanger).toHaveBeenCalled();
});

it('lists each failed name once in the warning', async () => {
  (copyDashboardPanels as jest.Mock).mockResolvedValueOnce({ panels, failures: ['A', 'A'] });
  const { stateContainer, source, services } = setup();
  await saveNewDashboard(
    { title: 'New', copyPanels: { titleTemplate: 'x' }, saveOptions },
    stateContainer,
    source,
    services
  );

  const warning = services.notifications.toasts.addWarning.mock.calls[0][0];
  expect(warning.text).toBe('A');
});

it('does not say copies were kept when every panel is by value', async () => {
  (copyDashboardPanels as jest.Mock).mockResolvedValueOnce({ panels: [], failures: [] });
  const { stateContainer, source, services } = setup(
    jest.fn().mockRejectedValue(new Error('boom'))
  );
  await saveNewDashboard(
    { title: 'New', copyPanels: { titleTemplate: 'x' }, saveOptions },
    { getState: () => ({ ...stateContainer.getState(), panels: [{ panelIndex: '1' }] }) } as any,
    source,
    services
  );

  expect(services.notifications.toasts.addDanger.mock.calls[0][0].text).toBeUndefined();
});

it('does not save when cancelled during the copy', async () => {
  const controller = new AbortController();
  (copyDashboardPanels as jest.Mock).mockImplementationOnce(async () => {
    controller.abort();
    return { panels, failures: [] };
  });
  const { draft, stateContainer, source, services } = setup();
  const result = await saveNewDashboard(
    { title: 'New', copyPanels: { titleTemplate: 'x' }, saveOptions, signal: controller.signal },
    stateContainer,
    source,
    services
  );

  expect(result).toEqual({});
  expect(draft.save).not.toHaveBeenCalled();
  expect(services.notifications.toasts.addDanger).not.toHaveBeenCalled();
});

it('still warns about uncopied panels after a late cancel', async () => {
  const controller = new AbortController();
  (copyDashboardPanels as jest.Mock).mockResolvedValueOnce({ panels, failures: ['Other'] });
  const { stateContainer, source, services } = setup(
    jest.fn(async () => {
      controller.abort();
      return 'new-id';
    })
  );
  const result = await saveNewDashboard(
    { title: 'New', copyPanels: { titleTemplate: 'x' }, saveOptions, signal: controller.signal },
    stateContainer,
    source,
    services
  );

  expect(result).toEqual({});
  expect(services.notifications.toasts.addSuccess).toHaveBeenCalled();
  expect(services.notifications.toasts.addWarning).toHaveBeenCalled();
});

it('does not navigate when cancelled during the save', async () => {
  const controller = new AbortController();
  const { stateContainer, source, services, history } = setup(
    jest.fn(async () => {
      controller.abort();
      return 'new-id';
    })
  );
  const result = await saveNewDashboard(
    { title: 'New', saveOptions, signal: controller.signal },
    stateContainer,
    source,
    services
  );

  expect(result).toEqual({});
  expect(history.location.pathname).toBe('/view/source');
  // The dashboard exists, so the user is still told it was saved.
  expect(services.notifications.toasts.addSuccess).toHaveBeenCalled();
});
