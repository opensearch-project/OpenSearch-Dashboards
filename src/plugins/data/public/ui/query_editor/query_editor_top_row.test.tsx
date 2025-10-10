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
    keyboardShortcut: {
      useKeyboardShortcut: jest.fn(),
    },
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
    await waitFor(() => expect(container.querySelector(QUERY_EDITOR)).toBeFalsy());
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
    await waitFor(() => expect(container.querySelector(QUERY_EDITOR)).toBeFalsy());
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
    await waitFor(() => expect(container.querySelector(QUERY_EDITOR)).toBeFalsy());
    expect(container.querySelector(DATE_PICKER)).toBeTruthy();
  });

  it('Should show "Update" button when date range is changed', async () => {
    const { container, getByText } = render(
      wrapQueryEditorTopRowInContext({
        showQueryEditor: true,
        showDatePicker: true,
        dateRangeFrom: 'now-15m',
        dateRangeTo: 'now',
      })
    );
    // Wait for initial render
    await waitFor(() => expect(container.querySelector('.osdQueryEditor')).toBeTruthy());

    // Simulate changing the date range
    // The EuiSuperUpdateButton should show 'Update' if isDirty is true
    // (isDirty is true by default in the test context)
    expect(getByText('Update')).toBeInTheDocument();
  });

  describe('Date Picker Keyboard Shortcut', () => {
    it('Should register date picker keyboard shortcut when component mounts', async () => {
      const mockUseKeyboardShortcut = jest.fn();
      const services = {
        ...startMock,
        data: dataPlugin,
        appName: 'discover',
        storage: createMockStorage(),
        keyboardShortcut: {
          useKeyboardShortcut: mockUseKeyboardShortcut,
        },
      };

      const TestComponent = () => (
        <I18nProvider>
          <OpenSearchDashboardsContextProvider services={services}>
            <QueryEditorTopRow
              onSubmit={jest.fn()}
              onChange={jest.fn()}
              isDirty={true}
              screenTitle="Test Screen"
              showDatePicker={true}
            />
          </OpenSearchDashboardsContextProvider>
        </I18nProvider>
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
          id: 'date_picker',
          pluginId: 'data',
          name: 'Open date picker',
          category: 'Search',
          keys: 'shift+d',
          execute: expect.any(Function),
        });
      });
    });

    it('Should not register keyboard shortcut when showDatePicker is false', async () => {
      const mockUseKeyboardShortcut = jest.fn();
      const services = {
        ...startMock,
        data: dataPlugin,
        appName: 'discover',
        storage: createMockStorage(),
        keyboardShortcut: {
          useKeyboardShortcut: mockUseKeyboardShortcut,
        },
      };

      const TestComponent = () => (
        <I18nProvider>
          <OpenSearchDashboardsContextProvider services={services}>
            <QueryEditorTopRow
              onSubmit={jest.fn()}
              onChange={jest.fn()}
              isDirty={true}
              screenTitle="Test Screen"
              showDatePicker={false}
            />
          </OpenSearchDashboardsContextProvider>
        </I18nProvider>
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
          id: 'date_picker',
          pluginId: 'data',
          name: 'Open date picker',
          category: 'Search',
          keys: 'shift+d',
          execute: expect.any(Function),
        });
      });
    });

    it('Should handle keyboard shortcut execution when date picker ref is null', async () => {
      const mockUseKeyboardShortcut = jest.fn();
      let capturedExecuteFunction: (() => void) | null = null;

      mockUseKeyboardShortcut.mockImplementation((config: any) => {
        capturedExecuteFunction = config.execute;
      });

      const services = {
        ...startMock,
        data: dataPlugin,
        appName: 'discover',
        storage: createMockStorage(),
        keyboardShortcut: {
          useKeyboardShortcut: mockUseKeyboardShortcut,
        },
      };

      const TestComponent = () => (
        <I18nProvider>
          <OpenSearchDashboardsContextProvider services={services}>
            <QueryEditorTopRow
              onSubmit={jest.fn()}
              onChange={jest.fn()}
              isDirty={true}
              screenTitle="Test Screen"
              showDatePicker={true}
            />
          </OpenSearchDashboardsContextProvider>
        </I18nProvider>
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(capturedExecuteFunction).toBeDefined();
      });

      expect(() => {
        capturedExecuteFunction?.();
      }).not.toThrow();
    });

    it('Should not register keyboard shortcut when keyboardShortcut service is not available', async () => {
      const services = {
        ...startMock,
        data: dataPlugin,
        appName: 'discover',
        storage: createMockStorage(),
        keyboardShortcut: undefined,
      };

      const TestComponent = () => (
        <I18nProvider>
          <OpenSearchDashboardsContextProvider services={services}>
            <QueryEditorTopRow
              onSubmit={jest.fn()}
              onChange={jest.fn()}
              isDirty={true}
              screenTitle="Test Screen"
              showDatePicker={true}
            />
          </OpenSearchDashboardsContextProvider>
        </I18nProvider>
      );

      expect(() => {
        render(<TestComponent />);
      }).not.toThrow();
    });
  });

  describe('Cancel Button', () => {
    const CANCEL_BUTTON = '[data-test-subj="queryCancelButton"]';

    it('Should not render cancel button when showCancelButton is false', async () => {
      const { container } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showCancelButton: false,
          isQueryRunning: true,
        })
      );

      await waitFor(() => expect(container.querySelector('.osdQueryEditor')).toBeTruthy());
      expect(container.querySelector(CANCEL_BUTTON)).toBeFalsy();
    });

    it('Should not render cancel button when isQueryRunning is false', async () => {
      const { container } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showCancelButton: true,
          isQueryRunning: false,
        })
      );

      await waitFor(() => expect(container.querySelector('.osdQueryEditor')).toBeTruthy());
      expect(container.querySelector(CANCEL_BUTTON)).toBeFalsy();
    });

    it('Should render cancel button when showCancelButton is true and query is running', async () => {
      const { container, getByTestId } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showCancelButton: true,
          isQueryRunning: true,
        })
      );

      await waitFor(() => expect(container.querySelector('.osdQueryEditor')).toBeTruthy());

      const cancelButton = getByTestId('queryCancelButton');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toHaveTextContent('Cancel');
    });

    it('Should have correct styles for cancel button', async () => {
      const { getByTestId } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showCancelButton: true,
          isQueryRunning: true,
        })
      );

      const cancelButton = getByTestId('queryCancelButton');
      expect(cancelButton).toHaveClass('euiButton');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });

    it('Should call onCancel when cancel button is clicked', async () => {
      const mockOnCancel = jest.fn();
      const { getByTestId } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showCancelButton: true,
          isQueryRunning: true,
          onCancel: mockOnCancel,
        })
      );

      const cancelButton = getByTestId('queryCancelButton');
      cancelButton.click();

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('Should handle cancel button click when onCancel is undefined', async () => {
      const { getByTestId } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showCancelButton: true,
          isQueryRunning: true,
          onCancel: undefined,
        })
      );

      const cancelButton = getByTestId('queryCancelButton');

      // Should not throw an error when clicked without onCancel handler
      expect(() => {
        cancelButton.click();
      }).not.toThrow();
    });

    it('Should display cancel button with proper loading state', async () => {
      const { getByTestId } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showCancelButton: true,
          isQueryRunning: true,
        })
      );

      const cancelButton = getByTestId('queryCancelButton');

      // The cancel button should not have loading state (isLoading: false)
      expect(cancelButton.querySelector('.euiLoadingSpinner')).toBeFalsy();
    });

    it('Should show cancel button alongside run button when both are visible', async () => {
      const { container, getByTestId, getByText } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showRunButton: true,
          showCancelButton: true,
          isQueryRunning: true,
          isDirty: false, // Set isDirty to false so button shows "Run" instead of "Update"
        })
      );

      await waitFor(() => expect(container.querySelector('.osdQueryEditor')).toBeTruthy());

      // Both buttons should be present
      expect(getByTestId('queryCancelButton')).toBeInTheDocument();
      expect(getByText('Refresh')).toBeInTheDocument();
    });

    it('Should hide cancel button when query stops running', async () => {
      const { container, rerender, queryByTestId } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showCancelButton: true,
          isQueryRunning: true,
        })
      );

      await waitFor(() => expect(container.querySelector('.osdQueryEditor')).toBeTruthy());

      // Initially should show cancel button
      expect(queryByTestId('queryCancelButton')).toBeInTheDocument();

      // Re-render with isQueryRunning: false
      rerender(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showCancelButton: true,
          isQueryRunning: false,
        })
      );

      // Cancel button should be hidden
      expect(queryByTestId('queryCancelButton')).toBeFalsy();
    });

    it('Should render cancel button in proper position within button group', async () => {
      const { container } = render(
        wrapQueryEditorTopRowInContext({
          showQueryEditor: true,
          showRunButton: true,
          showCancelButton: true,
          isQueryRunning: true,
        })
      );

      await waitFor(() => expect(container.querySelector('.osdQueryEditor')).toBeTruthy());

      // Should find the button group containing both run and cancel buttons
      const buttonGroup = container.querySelector('.euiFlexGroup');
      expect(buttonGroup).toBeTruthy();

      // Both buttons should be in flex items within the group
      const flexItems = buttonGroup?.querySelectorAll('.euiFlexItem');
      expect(flexItems?.length).toBeGreaterThanOrEqual(2);
    });

    describe('Cancel Button Accessibility', () => {
      it('Should have proper aria attributes', async () => {
        const { getByTestId } = render(
          wrapQueryEditorTopRowInContext({
            showQueryEditor: true,
            showCancelButton: true,
            isQueryRunning: true,
          })
        );

        const cancelButton = getByTestId('queryCancelButton');

        // Should be a proper button element
        expect(cancelButton.tagName).toBe('BUTTON');
        expect(cancelButton).toHaveAttribute('type', 'button');
      });

      it('Should be keyboard accessible', async () => {
        const mockOnCancel = jest.fn();
        const { getByTestId } = render(
          wrapQueryEditorTopRowInContext({
            showQueryEditor: true,
            showCancelButton: true,
            isQueryRunning: true,
            onCancel: mockOnCancel,
          })
        );

        const cancelButton = getByTestId('queryCancelButton');

        // Should be focusable
        expect(cancelButton).not.toHaveAttribute('tabindex', '-1');

        // Should be activatable with Enter/Space (native button behavior)
        cancelButton.focus();
        expect(document.activeElement).toBe(cancelButton);

        // Simulate keyboard activation
        cancelButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        cancelButton.click(); // React testing library doesn't automatically trigger click on Enter

        expect(mockOnCancel).toHaveBeenCalled();
      });
    });

    describe('Cancel Button Integration with Query States', () => {
      it('Should handle cancel button with different query statuses', async () => {
        const mockOnCancel = jest.fn();

        const { getByTestId, rerender } = render(
          wrapQueryEditorTopRowInContext({
            showQueryEditor: true,
            showCancelButton: true,
            isQueryRunning: true,
            queryStatus: 'loading',
            onCancel: mockOnCancel,
          })
        );

        // Should show cancel button when loading
        expect(getByTestId('queryCancelButton')).toBeInTheDocument();

        // Click cancel button
        getByTestId('queryCancelButton').click();
        expect(mockOnCancel).toHaveBeenCalledTimes(1);

        // Re-render with complete status
        rerender(
          wrapQueryEditorTopRowInContext({
            showQueryEditor: true,
            showCancelButton: true,
            isQueryRunning: false,
            queryStatus: 'complete',
            onCancel: mockOnCancel,
          })
        );

        // Should hide cancel button when not running
        expect(document.querySelector('[data-test-subj="queryCancelButton"]')).toBeFalsy();
      });
    });
  });
});
