/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { I18nProvider } from '@osd/i18n/react';
import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { createEditor, DQLBody, QueryEditorTopRow, SingleLineInput } from '../';
import { coreMock } from '../../../../../core/public/mocks';
import { Query, UI_SETTINGS } from '../../../common';
import { dataPluginMock } from '../../mocks';
import { DatasetTypeConfig, LanguageConfig } from '../../query';
import { datasetServiceMock } from '../../query/query_string/dataset_service/dataset_service.mock';
import { getQueryService } from '../../services';

const startMock = coreMock.createStart();

jest.mock('../../services', () => ({
  getQueryService: jest.fn(),
}));

startMock.uiSettings.get.mockImplementation((key: string) => {
  switch (key) {
    case UI_SETTINGS.TIMEPICKER_QUICK_RANGES:
      return [
        {
          from: 'now/d',
          to: 'now/d',
          display: 'Today',
        },
      ];
    case 'dateFormat':
      return 'MMM D, YYYY @ HH:mm:ss.SSS';
    case UI_SETTINGS.HISTORY_LIMIT:
      return 10;
    case UI_SETTINGS.TIMEPICKER_TIME_DEFAULTS:
      return {
        from: 'now-15m',
        to: 'now',
      };
    case UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED:
      return true;
    case 'theme:darkMode':
      return true;
    default:
      throw new Error(`Unexpected config key: ${key}`);
  }
});

const createMockWebStorage = () => ({
  clear: jest.fn(),
  getItem: jest.fn(),
  key: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
  length: 0,
});

const createMockStorage = () => ({
  storage: createMockWebStorage(),
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
});

const dataPlugin = dataPluginMock.createStartContract(true);
const datasetService = datasetServiceMock.createStartContract();

function wrapQueryEditorTopRowInContext(testProps: any) {
  const defaultOptions = {
    onSubmit: jest.fn(),
    onChange: jest.fn(),
    isDirty: true,
    screenTitle: 'Another Screen',
  };

  const mockLanguage: LanguageConfig = {
    id: 'test-language',
    title: 'Test Language',
    search: {} as any,
    getQueryString: jest.fn(),
    editor: createEditor(SingleLineInput, SingleLineInput, [], DQLBody),
    fields: {},
    showDocLinks: true,
    editorSupportedAppNames: ['discover'],
    hideDatePicker: true,
  };
  dataPlugin.query.queryString.getLanguageService().registerLanguage(mockLanguage);

  const services = {
    ...startMock,
    data: dataPlugin,
    appName: 'discover',
    storage: createMockStorage(),
  };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <QueryEditorTopRow {...defaultOptions} {...testProps} />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}

describe('QueryEditorTopRow', () => {
  const QUERY_EDITOR = '.osdQueryEditor';
  const DATE_PICKER = '.osdQueryEditor__datePickerWrapper';

  beforeEach(() => {
    jest.clearAllMocks();
    (getQueryService as jest.Mock).mockReturnValue(dataPlugin.query);
    dataPlugin.query.queryString.getDatasetService = jest.fn().mockReturnValue(datasetService);
  });

  afterEach(() => {
    cleanup();
    jest.resetModules();
  });

  it('Should render query editor', async () => {
    const { container } = render(
      wrapQueryEditorTopRowInContext({
        showQueryEditor: true,
      })
    );
    await waitFor(() => expect(container.querySelector(QUERY_EDITOR)).toBeTruthy());
    expect(container.querySelector(DATE_PICKER)).toBeTruthy();
  });

  it('Should not render date picker if showDatePicker is false', async () => {
    const { container } = render(
      wrapQueryEditorTopRowInContext({
        showQueryEditor: true,
        showDatePicker: false,
      })
    );
    await waitFor(() => expect(container.querySelector(QUERY_EDITOR)).toBeTruthy());
    expect(container.querySelector(DATE_PICKER)).toBeFalsy();
  });

  it('Should not render date picker if language does not support time field', async () => {
    const query: Query = {
      query: 'test query',
      language: 'test-language',
    };
    dataPlugin.query.queryString.getQuery = jest.fn().mockReturnValue(query);
    const { container } = render(
      wrapQueryEditorTopRowInContext({
        query,
        showQueryEditor: false,
        showDatePicker: true,
      })
    );
    await waitFor(() => expect(container.querySelector(QUERY_EDITOR)).toBeTruthy());
    expect(container.querySelector(DATE_PICKER)).toBeFalsy();
  });

  it('Should not render date picker if dataset type does not support time field', async () => {
    const query: Query = {
      query: 'test query',
      dataset: datasetService.getDefault(),
      language: 'test-language',
    };
    dataPlugin.query.queryString.getQuery = jest.fn().mockReturnValue(query);
    datasetService.getType.mockReturnValue({
      meta: { supportsTimeFilter: false },
    } as DatasetTypeConfig);

    const { container } = render(
      wrapQueryEditorTopRowInContext({
        query,
        showQueryEditor: false,
        showDatePicker: true,
      })
    );
    await waitFor(() => expect(container.querySelector(QUERY_EDITOR)).toBeTruthy());
    expect(container.querySelector(DATE_PICKER)).toBeFalsy();
  });

  it('Should render date picker if dataset overrides hideDatePicker to false', async () => {
    const query: Query = {
      query: 'test query',
      dataset: datasetService.getDefault(),
      language: 'test-language',
    };
    dataPlugin.query.queryString.getQuery = jest.fn().mockReturnValue(query);
    datasetService.getType.mockReturnValue(({
      meta: { supportsTimeFilter: true },
      languageOverrides: { 'test-language': { hideDatePicker: false } },
    } as unknown) as DatasetTypeConfig);

    const { container } = render(
      wrapQueryEditorTopRowInContext({
        query,
        showQueryEditor: false,
        showDatePicker: true,
      })
    );
    await waitFor(() => expect(container.querySelector(QUERY_EDITOR)).toBeTruthy());
    expect(container.querySelector(DATE_PICKER)).toBeTruthy();
  });
});
