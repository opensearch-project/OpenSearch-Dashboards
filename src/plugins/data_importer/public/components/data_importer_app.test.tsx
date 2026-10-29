/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataImporterHandle, DataImporterPluginApp } from './data_importer_app';
import { coreMock } from '../../../../core/public/mocks';
import { testDataSourceManagementPlugin } from '../../../data_source_management/public/mocks';
import { PublicConfigSchema } from '../../config';
import { navigationPluginMock } from '../../../navigation/public/mocks';
import { DEFAULT_SUPPORTED_FILE_TYPES_LIST, PLUGIN_ID } from '../../common';
import { importFile } from '../lib/import_file';
import { catIndices } from '../lib/cat_indices';
import { ImportResponse } from '../types';

jest.mock('../lib/import_file', () => ({ importFile: jest.fn() }));
jest.mock('../lib/cat_indices', () => ({ catIndices: jest.fn() }));

const mockImportFile = importFile as jest.MockedFunction<typeof importFile>;
const mockCatIndices = catIndices as jest.MockedFunction<typeof catIndices>;

const SUCCESS: ImportResponse = {
  success: true,
  message: { total: 3, message: 'Indexed 3 documents', failedRows: [] },
};

describe('App', () => {
  beforeEach(() => {
    mockImportFile.mockReset();
    mockCatIndices.mockReset();
    mockCatIndices.mockResolvedValue({ indices: ['lookups'] });
    (notificationsMock.toasts.addDanger as jest.Mock).mockClear();
    (notificationsMock.toasts.addSuccess as jest.Mock).mockClear();
  });

  const notificationsMock = coreMock.createStart().notifications;
  const httpMock = coreMock.createStart().http;
  const savedObjectsMock = coreMock.createStart().savedObjects;
  const navigationMock = navigationPluginMock.createStartContract();
  const mockConfig: PublicConfigSchema = {
    filePreviewDocumentsCount: 10,
    enabledFileTypes: DEFAULT_SUPPORTED_FILE_TYPES_LIST,
    maxFileSizeBytes: 104857600,
    maxTextCount: 10000,
  };

  it('should render without MDS', () => {
    const dataSourceManagementMock = {
      registerAuthenticationMethod: jest.fn(),
      registerDirectQueryConnectionFlow: jest.fn(),
      ui: {
        DataSourceSelector: () => <div>Mock DataSourceSelector</div>,
        getDataSourceMenu: jest.fn(),
      },
      dataSourceSelection: {} as any,
      getDefaultDataSourceId: jest.fn(),
      getDefaultDataSourceId$: jest.fn(),
    };
    const { container } = render(
      <DataImporterPluginApp
        basename={PLUGIN_ID}
        notifications={notificationsMock}
        http={httpMock}
        savedObjects={savedObjectsMock}
        navigation={navigationMock}
        config={mockConfig}
        dataSourceEnabled={false}
        hideLocalCluster={false}
        dataSourceManagement={dataSourceManagementMock}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render with MDS', () => {
    const dataSourceManagementMock = testDataSourceManagementPlugin(
      coreMock.createSetup(),
      coreMock.createStart()
    ).setup;

    // @ts-expect-error
    dataSourceManagementMock.ui.getDataSourceMenu = jest.fn(() => <div>DataSourceMenu</div>);

    const { container } = render(
      <DataImporterPluginApp
        basename={PLUGIN_ID}
        notifications={notificationsMock}
        http={httpMock}
        savedObjects={savedObjectsMock}
        navigation={navigationMock}
        config={mockConfig}
        dataSourceEnabled={true}
        hideLocalCluster={false}
        dataSourceManagement={dataSourceManagementMock}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render in embedded mode without Router and page wrappers', () => {
    const dataSourceManagementMock = {
      registerAuthenticationMethod: jest.fn(),
      registerDirectQueryConnectionFlow: jest.fn(),
      ui: {
        DataSourceSelector: () => <div>Mock DataSourceSelector</div>,
        getDataSourceMenu: jest.fn(),
      },
      dataSourceSelection: {} as any,
      getDefaultDataSourceId: jest.fn(),
      getDefaultDataSourceId$: jest.fn(),
    };
    const { container } = render(
      <DataImporterPluginApp
        basename={PLUGIN_ID}
        notifications={notificationsMock}
        http={httpMock}
        savedObjects={savedObjectsMock}
        navigation={navigationMock}
        config={mockConfig}
        dataSourceEnabled={false}
        hideLocalCluster={false}
        dataSourceManagement={dataSourceManagementMock}
        embedded={true}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render with Router when embedded is false', () => {
    const dataSourceManagementMock = {
      registerAuthenticationMethod: jest.fn(),
      registerDirectQueryConnectionFlow: jest.fn(),
      ui: {
        DataSourceSelector: () => <div>Mock DataSourceSelector</div>,
        getDataSourceMenu: jest.fn(),
      },
      dataSourceSelection: {} as any,
      getDefaultDataSourceId: jest.fn(),
      getDefaultDataSourceId$: jest.fn(),
    };
    const { container } = render(
      <DataImporterPluginApp
        basename={PLUGIN_ID}
        notifications={notificationsMock}
        http={httpMock}
        savedObjects={savedObjectsMock}
        navigation={navigationMock}
        config={mockConfig}
        dataSourceEnabled={false}
        hideLocalCluster={false}
        dataSourceManagement={dataSourceManagementMock}
        embedded={false}
      />
    );
    expect(container).toMatchSnapshot();
  });

  describe('dirty-state close guard', () => {
    const renderEmbedded = () => {
      const ref = React.createRef<DataImporterHandle>();
      const onClose = jest.fn();
      render(
        <DataImporterPluginApp
          ref={ref}
          basename={PLUGIN_ID}
          notifications={notificationsMock}
          http={httpMock}
          savedObjects={savedObjectsMock}
          navigation={navigationMock}
          config={mockConfig}
          dataSourceEnabled={false}
          hideLocalCluster={false}
          embedded={true}
          onClose={onClose}
        />
      );
      return { ref, onClose };
    };

    // Simulates the modal's X / Escape / Done, which all route through the handle.
    const requestClose = (ref: React.RefObject<DataImporterHandle>) =>
      act(() => {
        ref.current?.requestClose();
      });

    const selectIndex = async (name: string) => {
      const input = screen.getByTestId('comboBoxSearchInput');
      fireEvent.change(input, { target: { value: name } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await waitFor(() => expect(screen.getByText(name)).toBeInTheDocument());
    };

    const attachFile = async (name: string, { expectEnabled = true } = {}) => {
      const input = document.getElementById('data-importer-file-picker') as HTMLInputElement;
      const file = new File(['a,b\n1,2\n'], name, { type: 'text/csv' });
      fireEvent.change(input, { target: { files: [file] } });
      if (expectEnabled) {
        // Import enables once both an index and a file are set.
        await waitFor(() => expect(screen.getByTestId('dataImporterImportButton')).toBeEnabled());
      } else {
        // Attaching while an import is in flight: the Import button is intentionally disabled
        // (loading state), so let the change flush without asserting it is enabled.
        await act(async () => {});
      }
    };

    const clickImport = async () => {
      const calls = mockImportFile.mock.calls.length;
      fireEvent.click(screen.getByTestId('dataImporterImportButton'));
      await waitFor(() => expect(mockImportFile).toHaveBeenCalledTimes(calls + 1));
      // Let the response handling (state updates, index refresh) settle.
      await act(async () => {});
    };

    const confirmModal = () => screen.queryByTestId('dataImporterDiscardConfirmModal');

    it('renders Import as the filled primary action', () => {
      renderEmbedded();
      expect(screen.getByTestId('dataImporterImportButton')).toHaveClass('euiButton--fill');
      expect(screen.getByTestId('dataImporterPreviewButton')).not.toHaveClass('euiButton--fill');
    });

    it('closes directly when nothing is attached (clean)', () => {
      const { ref, onClose } = renderEmbedded();
      requestClose(ref);
      expect(confirmModal()).not.toBeInTheDocument();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('prompts before discarding an attached-but-unimported file', async () => {
      const { ref, onClose } = renderEmbedded();
      await selectIndex('dim_host');
      await attachFile('dim_host.csv');

      requestClose(ref);
      expect(confirmModal()).toBeInTheDocument();
      expect(screen.getByText("You haven't imported this file. Discard?")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();

      // Cancel keeps the flyout open and the work intact.
      fireEvent.click(screen.getByTestId('confirmModalCancelButton'));
      expect(confirmModal()).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();

      // Discard actually closes.
      requestClose(ref);
      fireEvent.click(screen.getByTestId('confirmModalConfirmButton'));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockImportFile).not.toHaveBeenCalled();
    });

    it('clears dirty after a successful import, keeping the flyout open', async () => {
      mockImportFile.mockResolvedValue(SUCCESS);
      const { ref, onClose } = renderEmbedded();
      await selectIndex('dim_host');
      await attachFile('dim_host.csv');
      await clickImport();

      // Import never closes the flyout on its own.
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByTestId('dataImporterImportButton')).toBeInTheDocument();

      requestClose(ref);
      expect(confirmModal()).not.toBeInTheDocument();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('supports importing several files in one flyout, re-arming dirty per file', async () => {
      mockImportFile.mockResolvedValue(SUCCESS);
      const { ref, onClose } = renderEmbedded();
      await selectIndex('lookups');

      await attachFile('dim_host.csv');
      await clickImport();

      await attachFile('dim_client.csv');
      requestClose(ref);
      expect(confirmModal()).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('confirmModalCancelButton'));

      await clickImport();
      expect(mockImportFile).toHaveBeenCalledTimes(2);
      expect(mockImportFile.mock.calls[0][0].file.name).toBe('dim_host.csv');
      expect(mockImportFile.mock.calls[1][0].file.name).toBe('dim_client.csv');

      requestClose(ref);
      expect(confirmModal()).not.toBeInTheDocument();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stays dirty when a different file is attached while an import is in flight', async () => {
      let resolveImport: (r: ImportResponse) => void = () => {};
      mockImportFile.mockImplementation(
        () => new Promise<ImportResponse>((resolve) => (resolveImport = resolve))
      );
      const { ref, onClose } = renderEmbedded();
      await selectIndex('lookups');
      await attachFile('dim_host.csv');
      fireEvent.click(screen.getByTestId('dataImporterImportButton'));
      await waitFor(() => expect(mockImportFile).toHaveBeenCalledTimes(1));

      await attachFile('dim_client.csv', { expectEnabled: false });
      await act(async () => resolveImport(SUCCESS));

      // dim_client.csv was never imported, so closing must still prompt.
      requestClose(ref);
      expect(confirmModal()).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('shows an in-flight loading state during import and clears it when done', async () => {
      let resolveImport: (r: ImportResponse) => void = () => {};
      mockImportFile.mockImplementation(
        () => new Promise<ImportResponse>((resolve) => (resolveImport = resolve))
      );
      renderEmbedded();
      await selectIndex('lookups');
      await attachFile('dim_host.csv');

      fireEvent.click(screen.getByTestId('dataImporterImportButton'));
      // While in flight: progress bar shown and the Import button disabled.
      await waitFor(() =>
        expect(screen.getByTestId('dataImporterImportProgress')).toBeInTheDocument()
      );
      expect(screen.getByTestId('dataImporterImportButton')).toBeDisabled();

      await act(async () => resolveImport(SUCCESS));
      // After completion: progress bar gone.
      await waitFor(() =>
        expect(screen.queryByTestId('dataImporterImportProgress')).not.toBeInTheDocument()
      );
    });

    it('stays dirty when the import fails', async () => {
      mockImportFile.mockRejectedValue({ body: { message: 'boom' } });
      const { ref, onClose } = renderEmbedded();
      await selectIndex('dim_host');
      await attachFile('dim_host.csv');
      await clickImport();

      requestClose(ref);
      expect(confirmModal()).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('stays dirty when only some rows were ingested', async () => {
      mockImportFile.mockResolvedValue({
        success: false,
        message: { total: 3, message: 'Indexed 1 documents', failedRows: [2, 3] },
      });
      const { ref } = renderEmbedded();
      await selectIndex('dim_host');
      await attachFile('dim_host.csv');
      await clickImport();

      requestClose(ref);
      expect(confirmModal()).toBeInTheDocument();
    });

    it('renders the bucketed errorSummary (cause + count + sample rows), not a raw row dump', async () => {
      mockImportFile.mockResolvedValue({
        success: false,
        partial: false,
        message: {
          total: 15,
          message: 'Indexed 0 documents',
          failedRows: Array.from({ length: 15 }, (_, i) => i + 1),
          errorSummary: [
            {
              type: 'mapper_parsing_exception',
              reason: 'failed to parse field [age] of type [integer]',
              count: 15,
              sampleRows: [1, 2, 3, 4, 5],
            },
          ],
        },
      });
      renderEmbedded();
      await selectIndex('dim_host');
      await attachFile('dim_host.csv');
      await clickImport();

      await waitFor(() => expect(notificationsMock.toasts.addDanger).toHaveBeenCalled());
      const msg = (notificationsMock.toasts.addDanger as jest.Mock).mock.calls.pop()[0];
      const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
      expect(text).toContain('15 of 15 rows failed to ingest');
      expect(text).toContain('failed to parse field [age] of type [integer]');
      expect(text).toContain('e.g. 1, 2, 3, 4, 5');
    });

    it('falls back to the row-number list when no errorSummary is present', async () => {
      mockImportFile.mockResolvedValue({
        success: false,
        partial: true,
        message: { total: 3, message: 'Indexed 1 documents', failedRows: [2, 3] },
      });
      renderEmbedded();
      await selectIndex('dim_host');
      await attachFile('dim_host.csv');
      await clickImport();

      await waitFor(() => expect(notificationsMock.toasts.addDanger).toHaveBeenCalled());
      const msg = (notificationsMock.toasts.addDanger as jest.Mock).mock.calls.pop()[0];
      const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
      expect(text).toContain('2 of 3 rows failed to ingest');
      expect(text).toContain('2, 3');
    });

    it('fails loudly when the rows landed but the lookup alias could not be created', async () => {
      const aliasError =
        'You do not have permission to manage aliases (indices:admin/aliases/get). Try creating an index directly.';
      mockImportFile.mockResolvedValue({
        success: true,
        partial: false,
        aliasCreated: false,
        aliasError,
        message: { total: 3, message: 'Indexed 3 documents', failedRows: [] },
      });
      const { ref, onClose } = renderEmbedded();
      await selectIndex('dim_host');
      await attachFile('dim_host.csv');
      await clickImport();

      await waitFor(() => expect(notificationsMock.toasts.addDanger).toHaveBeenCalled());
      const msg = (notificationsMock.toasts.addDanger as jest.Mock).mock.calls.pop()[0];
      const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
      expect(text).toContain('the lookup could not be created');
      expect(text).toContain(aliasError);
      expect(notificationsMock.toasts.addSuccess).not.toHaveBeenCalled();

      // Not a clean import: closing still asks before discarding.
      requestClose(ref);
      expect(confirmModal()).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('reports both row failures and the alias failure on a partial import', async () => {
      mockImportFile.mockResolvedValue({
        success: false,
        partial: true,
        aliasCreated: false,
        aliasError: 'an index exists with the same name as the alias',
        message: { total: 3, message: 'Indexed 1 documents', failedRows: [2, 3] },
      });
      renderEmbedded();
      await selectIndex('dim_host');
      await attachFile('dim_host.csv');
      await clickImport();

      await waitFor(() => expect(notificationsMock.toasts.addDanger).toHaveBeenCalledTimes(2));
      const texts = (notificationsMock.toasts.addDanger as jest.Mock).mock.calls.map(([m]) =>
        typeof m === 'string' ? m : JSON.stringify(m)
      );
      expect(texts.some((t) => t.includes('2 of 3 rows failed to ingest'))).toBe(true);
      expect(texts.some((t) => t.includes('an index exists with the same name as the alias'))).toBe(
        true
      );
    });
  });
});
