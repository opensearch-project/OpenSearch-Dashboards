/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { saveSavedExplore } from './save_explore'; // adjust path
import { setSavedSearch } from '../application/utils/state_management/slices';

jest.mock('../application/utils/state_management/slices', () => ({
  setSavedSearch: jest.fn(),
}));

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn(),
  },
}));

const createMockServices = () => ({
  toastNotifications: {
    addSuccess: jest.fn(),
    addDanger: jest.fn(),
  },
  chrome: {
    docTitle: { change: jest.fn() },
    setBreadcrumbs: jest.fn(),
  },
  history: jest.fn(() => ({
    push: jest.fn(),
  })),
  store: {
    getState: jest.fn(() => ({
      legacy: {
        columns: ['column1', 'column2'],
        sort: [['column1', 'asc']],
      },
    })),
    dispatch: jest.fn(),
  },
});

describe('saveSavedExplore', () => {
  let savedExplore: any;
  let services: any;
  let searchContext: any;
  let saveOptions: any;

  beforeEach(() => {
    savedExplore = {
      id: '123',
      title: 'Old Title',
      save: jest.fn(),
      searchSourceFields: {},
    };

    services = createMockServices();

    searchContext = {
      query: { query: 'test', language: 'kuery' },
      filters: [],
    };

    saveOptions = {
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: jest.fn(),
    };
  });

  it('should save and update title (same id)', async () => {
    savedExplore.save.mockResolvedValue('123');
    const result = await saveSavedExplore({
      savedExplore,
      newTitle: 'New Title',
      saveOptions,
      searchContext,
      services,
      startSyncingQueryStateWithUrl: jest.fn(),
      openAfterSave: false,
      newCopyOnSave: false,
    });

    expect(savedExplore.title).toBe('New Title');
    expect(savedExplore.save).toHaveBeenCalledTimes(1);
    expect(savedExplore.save).toHaveBeenCalledWith(saveOptions);
    expect(result).toEqual({ id: '123' });
  });

  it('should save a new save explore and redirect if id changes', async () => {
    savedExplore.save.mockResolvedValue('456');

    const result = await saveSavedExplore({
      savedExplore,
      newTitle: 'Updated Title',
      saveOptions,
      searchContext,
      services,
      startSyncingQueryStateWithUrl: jest.fn(),
      openAfterSave: true,
      newCopyOnSave: true,
    });
    expect(result).toEqual({ id: '456' });
    expect(services.toastNotifications.addSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        title: i18n.translate('explore.saveSuccessTitle', {
          defaultMessage: 'Explore saved',
        }),
      })
    );
    expect(services.store.dispatch).toHaveBeenCalledWith(setSavedSearch('456'));
  });

  it('should handle save failure', async () => {
    savedExplore.save.mockRejectedValue(new Error('Save failed'));

    await saveSavedExplore({
      savedExplore,
      newTitle: 'Failed Title',
      saveOptions,
      searchContext,
      services,
      startSyncingQueryStateWithUrl: jest.fn(),
      openAfterSave: true,
    });

    expect(services.toastNotifications.addDanger).toHaveBeenCalledWith(
      expect.objectContaining({
        title: undefined,
        text: 'Save failed',
      })
    );
    expect(savedExplore.title).toBe('Old Title'); // title restored
  });
});
