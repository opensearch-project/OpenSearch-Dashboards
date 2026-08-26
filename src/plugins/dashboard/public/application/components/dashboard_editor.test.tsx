/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, waitFor } from '@testing-library/react';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { createDashboardServicesMock } from '../utils/mocks';
import { DashboardEditor } from './dashboard_editor';

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(() => ({ id: 'dashboard-id' })),
}));

jest.mock('../components/dashboard_top_nav', () => {
  return {
    DashboardTopNav: jest.fn(() => null),
  };
});

jest.mock('./dashboard_variables', () => {
  return {
    DashboardVariables: jest.fn(() => null),
  };
});

jest.mock('../utils/use/use_chrome_visibility', () => ({
  useChromeVisibility: jest.fn(() => true),
}));

jest.mock('../utils/use/use_saved_dashboard_instance', () => ({
  useSavedDashboardInstance: jest.fn(),
}));

jest.mock('../utils/use/use_dashboard_app_state', () => ({
  useDashboardAppAndGlobalState: jest.fn(),
}));

jest.mock('../utils/use/use_editor_updates', () => ({
  useEditorUpdates: jest.fn(),
}));

describe('DashboardEditor dashboard variables', () => {
  const { useSavedDashboardInstance } = jest.requireMock(
    '../utils/use/use_saved_dashboard_instance'
  );
  const { useDashboardAppAndGlobalState } = jest.requireMock(
    '../utils/use/use_dashboard_app_state'
  );
  const { useEditorUpdates } = jest.requireMock('../utils/use/use_editor_updates');
  const { DashboardVariables } = jest.requireMock('./dashboard_variables');

  const variableService = { getVariables: jest.fn() };
  const variableInterpolationService = {};
  const currentContainer = {
    variableService,
    variableInterpolationService,
    getPanelQueries: jest.fn(() => []),
  };
  const appState = {
    transitions: {
      set: jest.fn(),
    },
  };
  const savedDashboardInstance = { id: 'dashboard-id' };
  const dashboard = {};

  const renderDashboardEditor = ({
    variablesEnabled = true,
    exploreEnabled = true,
  }: {
    variablesEnabled?: boolean;
    exploreEnabled?: boolean;
  } = {}) => {
    const services = {
      ...createDashboardServicesMock(),
      pluginInitializerContext: {
        config: {
          get: jest.fn(() => ({ variables: { enabled: variablesEnabled } })),
        },
      },
    };
    services.uiSettings.get = jest.fn(() => false);
    services.application.capabilities = {
      ...services.application.capabilities,
      ...(exploreEnabled ? { explore: { show: true } } : {}),
    };

    return render(
      <OpenSearchDashboardsContextProvider services={services}>
        <DashboardEditor />
      </OpenSearchDashboardsContextProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useSavedDashboardInstance.mockReturnValue({
      savedDashboard: savedDashboardInstance,
      dashboard,
    });
    useDashboardAppAndGlobalState.mockReturnValue({
      appState,
      currentContainer,
      indexPatterns: [],
    });
    useEditorUpdates.mockReturnValue({
      isEmbeddableRendered: true,
      currentAppState: { viewMode: 'edit' },
    });
  });

  it('renders variables when the feature and Explore are enabled', async () => {
    renderDashboardEditor();

    await waitFor(() => {
      expect(DashboardVariables).toHaveBeenCalledWith(
        expect.objectContaining({
          variableService,
          interpolationService: variableInterpolationService,
          isEditMode: true,
          dashboardId: 'dashboard-id',
        }),
        expect.anything()
      );
    });
  });

  it('does not render variables when the feature is disabled', async () => {
    renderDashboardEditor({ variablesEnabled: false });

    await waitFor(() => {
      expect(DashboardVariables).not.toHaveBeenCalled();
    });
  });

  it('does not render variables when Explore is disabled', async () => {
    renderDashboardEditor({ exploreEnabled: false });

    await waitFor(() => {
      expect(DashboardVariables).not.toHaveBeenCalled();
    });
  });
});
