/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../core/public/mocks';
import { Dataset, DataStorage, IndexPatternsService, UI_SETTINGS } from '../../common';
import { ISearchInterceptor } from '../search';
import { QueryService } from './query_service';
import { BehaviorSubject } from 'rxjs';

jest.mock('../services', () => ({
  getUiSettings: jest.fn(),
}));

describe('QueryService', () => {
  const setup = coreMock.createSetup();
  const start = coreMock.createStart();
  const storage = new DataStorage(window.localStorage, 'queryServiceTest.');
  const sessionStorage = new DataStorage(window.sessionStorage, 'queryServiceTest.');
  let queryService: QueryService;

  beforeEach(() => {
    storage.clear();
    sessionStorage.clear();
    setup.uiSettings.get.mockImplementation((key: string) => {
      switch (key) {
        case UI_SETTINGS.SEARCH_QUERY_LANGUAGE:
          return 'kuery';
        case UI_SETTINGS.TIMEPICKER_TIME_DEFAULTS:
          return { from: 'now-15m', to: 'now' };
        case UI_SETTINGS.TIMEPICKER_REFRESH_INTERVAL_DEFAULTS:
          return { pause: true, value: 0 };
        case UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED:
          return true;
        case UI_SETTINGS.SEARCH_MAX_RECENT_DATASETS:
          return 4;
        default:
          return undefined;
      }
    });

    queryService = new QueryService();
    queryService.setup({
      uiSettings: setup.uiSettings,
      storage,
      sessionStorage,
      defaultSearchInterceptor: {} as jest.Mocked<ISearchInterceptor>,
      application: setup.application,
      notifications: setup.notifications,
    });
  });

  afterEach(() => {
    queryService.stop();
  });

  test('returns the default dataset after dataset initialization finishes', async () => {
    const datasetService = queryService.queryStringManager.getDatasetService();
    const defaultDataset: Dataset = {
      id: 'default-dataset',
      title: 'Default Dataset',
      type: 'INDEXES',
    };
    let resolveDatasetInitialization!: () => void;
    const datasetInitialization = new Promise<void>((resolve) => {
      resolveDatasetInitialization = resolve;
    });
    jest.spyOn(datasetService, 'init').mockReturnValue(datasetInitialization);
    const getDefault = jest.spyOn(datasetService, 'getDefault').mockReturnValue(defaultDataset);

    const queryStart = queryService.start({
      savedObjectsClient: start.savedObjects.client,
      storage,
      uiSettings: start.uiSettings,
      indexPatterns: {} as IndexPatternsService,
      application: start.application,
      notifications: start.notifications,
    });

    const defaultDatasetPromise = queryStart.getDefaultDataset();
    expect(getDefault).not.toHaveBeenCalled();

    resolveDatasetInitialization();

    await expect(defaultDatasetPromise).resolves.toEqual(defaultDataset);
    expect(getDefault).toHaveBeenCalledTimes(1);
  });

  test('uses the current application when resolving the default language', () => {
    const currentAppId$ = new BehaviorSubject<string | undefined>('discover');
    start.application.currentAppId$ = currentAppId$;
    storage.set('userQueryLanguage', 'PPL');
    storage.set('userQueryString', 'source = logs');
    queryService.queryStringManager.getLanguageService().registerLanguage({
      id: 'PPL',
      title: 'PPL',
      supportedAppNames: ['discover'],
      getQueryString: jest.fn(),
    } as any);

    queryService.start({
      savedObjectsClient: start.savedObjects.client,
      storage,
      uiSettings: start.uiSettings,
      indexPatterns: {} as IndexPatternsService,
      application: start.application,
      notifications: start.notifications,
    });

    expect(queryService.queryStringManager.getDefaultQuery()).toEqual({
      language: 'PPL',
      query: 'source = logs',
    });

    currentAppId$.next('visualize');

    expect(queryService.queryStringManager.getDefaultQuery()).toEqual({
      language: 'kuery',
      query: '',
    });
  });
});
