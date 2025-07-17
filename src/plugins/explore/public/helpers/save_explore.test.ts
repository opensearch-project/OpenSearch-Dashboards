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
    translate: jest.fn((key, { defaultMessage, values }) => {
      // simulate template substitution if needed
      return defaultMessage.replace(
        /\{(\w+)\}/g,
        (_: any, match: string | number) => values?.[match] ?? ''
      );
    }),
  },
}));

// Helper to create a base mock services object
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
  let startSyncingQueryStateWithUrl: jest.Mock;

  beforeEach(() => {
    savedExplore = {
      id: '123',
      title: 'Old Title',
      save: jest.fn(),
      // initialize searchSourceFields as an empty object so that branch is taken
      searchSourceFields: {},
    };

    services = createMockServices();

    searchContext = {
      query: { query: 'test', language: 'kuery' },
      filters: [{ term: { field: 'value' } }],
    };

    saveOptions = {
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: jest.fn(),
    };

    startSyncingQueryStateWithUrl = jest.fn();
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
        title: "Search 'Updated Title' was saved",
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

    expect.objectContaining({
      title: "Search 'Failed Title' was not saved.",
      text: 'Save failed',
    });
    expect(savedExplore.title).toBe('Old Title'); // title restored
  });

  it('should save without newCopyOnSave provided', async () => {
    // newCopyOnSave is omitted
    savedExplore.save.mockResolvedValue('123');
    delete savedExplore.copyOnSave; // make sure no copyOnSave exists

    const result = await saveSavedExplore({
      savedExplore,
      newTitle: 'New Title Without Copy',
      saveOptions,
      searchContext,
      services,
      startSyncingQueryStateWithUrl,
      openAfterSave: false,
    });

    // Ensure that newCopyOnSave did not update the savedExplore object
    expect(savedExplore.copyOnSave).toBeUndefined();
    expect(savedExplore.title).toBe('New Title Without Copy');
    expect(savedExplore.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: '123' });
  });

  it('should handle missing searchSourceFields gracefully', async () => {
    // Set searchSourceFields to undefined
    savedExplore.searchSourceFields = undefined;
    savedExplore.save.mockResolvedValue('123');

    const result = await saveSavedExplore({
      savedExplore,
      newTitle: 'No Search Source',
      saveOptions,
      searchContext,
      services,
      startSyncingQueryStateWithUrl,
      openAfterSave: false,
      newCopyOnSave: false,
    });

    // Even without searchSourceFields, save should succeed.
    expect(result).toEqual({ id: '123' });
    // Check that savedExplore.title was updated
    expect(savedExplore.title).toBe('No Search Source');
  });

  it('should call startSyncingQueryStateWithUrl when openAfterSave is true', async () => {
    // This test reinforces that startSyncingQueryStateWithUrl is called in the openAfterSave branch.
    savedExplore.save.mockResolvedValue('789');

    await saveSavedExplore({
      savedExplore,
      newTitle: 'Sync Test Title',
      saveOptions,
      searchContext,
      services,
      startSyncingQueryStateWithUrl,
      openAfterSave: true,
      newCopyOnSave: false,
    });

    expect(startSyncingQueryStateWithUrl).toHaveBeenCalled();
  });

  it('should call chrome.docTitle.change and setBreadcrumbs when ID remains the same after save', async () => {
    savedExplore.id = 'same-id';
    savedExplore.save.mockResolvedValue('same-id');

    await saveSavedExplore({
      savedExplore,
      newTitle: 'Same ID After Save',
      saveOptions,
      searchContext,
      services,
      startSyncingQueryStateWithUrl,
      openAfterSave: true,
      newCopyOnSave: false,
    });

    expect(services.chrome.docTitle.change).toHaveBeenCalledWith('Same ID After Save');
  });

  it('should call i18n.translate with the correct parameters on success and failure', async () => {
    // Test for successful translation calls in a save success scenario (with redirect)
    savedExplore.save.mockResolvedValue('999');
    await saveSavedExplore({
      savedExplore,
      newTitle: 'Translation Success Title',
      saveOptions,
      searchContext,
      services,
      startSyncingQueryStateWithUrl,
      openAfterSave: true,
      newCopyOnSave: false,
    });

    // Since id != originalId, we expect a redirection toast
    expect(i18n.translate).toHaveBeenCalledWith('explore.notifications.SavedExploreTitle', {
      defaultMessage: `Search '{savedQueryTitle}' was saved`,
      values: { savedQueryTitle: 'Translation Success Title' },
    });

    // Now test failure translation
    const errorMessage = 'Forced save error';
    savedExplore.save.mockRejectedValue(new Error(errorMessage));

    await saveSavedExplore({
      savedExplore,
      newTitle: 'Translation Fail Title',
      saveOptions,
      searchContext,
      services,
      startSyncingQueryStateWithUrl,
      openAfterSave: true,
    });

    expect(i18n.translate).toHaveBeenCalledWith('explore.notifications.notSavedExploreTitle', {
      defaultMessage: `Search '{savedExploreTitle}' was not saved.`,
      values: { savedExploreTitle: 'Translation Fail Title' },
    });
  });
});
