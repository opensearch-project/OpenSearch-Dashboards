/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { createOpenSearchDashboardsReactContext } from '../../../../../opensearch_dashboards_react/public';
import { coreMock, workspacesServiceMock } from '../../../../../../core/public/mocks';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceObject } from 'opensearch-dashboards/public';
import { IntlProvider } from 'react-intl';
import { IndexHeader } from './index_header';

describe('IndexHeader at new home page', () => {
  const dataset = {
    id: 'default-index',
    title: 'Test Index Pattern',
    fields: [],
    getFieldByName: (name: string) => undefined,
    getComputedFields: () => ({}),
    getScriptedFields: () => [],
    getNonScriptedFields: () => [],
    addScriptedField: async () => {},
    removeScriptedField: () => {},
  };
  const mockCoreStart = coreMock.createStart();
  const workspaceObject = {
    id: 'foo_id',
    name: 'foo',
  };
  const getIndexHeader = (props: any) => {
    const mockHeaderControl =
      (props?.header as Function) ||
      (() => {
        return null;
      });

    const setDefault = jest.fn();
    const refreshFields = jest.fn();
    const deleteDatasetClick = jest.fn();
    const { Provider } = createOpenSearchDashboardsReactContext({
      ...mockCoreStart,
      ...{
        application: {
          ...mockCoreStart.application,
          capabilities: {
            ...mockCoreStart.application.capabilities,
            workspaces: { enabled: props.workspaceEnabled },
          },
        },
        uiSettings: { ...mockCoreStart.uiSettings, get: jest.fn().mockReturnValue(true) },
        workspaces: {
          ...workspacesServiceMock.createStartContract(),
          currentWorkspace$: new BehaviorSubject<WorkspaceObject | null>(props?.workspace),
        },
        navigationUI: {
          HeaderControl: mockHeaderControl,
        },
      },
    });

    return (
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <Provider>
          <IndexHeader
            setDefault={setDefault}
            refreshFields={refreshFields}
            deleteDatasetClick={deleteDatasetClick}
            dataset={dataset}
            defaultIndex={props?.defaultIndex}
          />
        </Provider>
      </IntlProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the set default button when index is not default and workspace is disabled', () => {
    // @ts-expect-error TS7031 TODO(ts-error): fixme
    const mockHeaderControl = ({ controls }) => {
      return controls?.[1]?.label ?? null;
    };
    const { getByText } = render(
      getIndexHeader({
        header: mockHeaderControl,
        defaultIndex: 'no-default-index',
        workspaceEnabled: false,
      })
    );

    expect(getByText('Set as default index')).toBeInTheDocument();
  });

  it('does not render the set default button when index is default and workspace is disabled', () => {
    // @ts-expect-error TS7031 TODO(ts-error): fixme
    const mockHeaderControl = ({ controls }) => {
      return controls?.[1]?.label ?? null;
    };
    const { queryByText } = render(
      getIndexHeader({
        header: mockHeaderControl,
        defaultIndex: 'default-index',
        workspaceEnabled: false,
      })
    );

    expect(queryByText('Set as default index')).toBeNull();
  });

  it('renders the set default button when index is not default and user is in workspace', () => {
    // @ts-expect-error TS7031 TODO(ts-error): fixme
    const mockHeaderControl = ({ controls }) => {
      return controls?.[1]?.label ?? null;
    };
    const { getByText } = render(
      getIndexHeader({
        header: mockHeaderControl,
        defaultIndex: 'no-default-index',
        workspace: workspaceObject,
        workspaceEnabled: true,
      })
    );

    expect(getByText('Set as default index')).toBeInTheDocument();
  });

  it('does not render the set default button when index is default and user is in workspace', () => {
    // @ts-expect-error TS7031 TODO(ts-error): fixme
    const mockHeaderControl = ({ controls }) => {
      return controls?.[1]?.label ?? null;
    };
    const { queryByText } = render(
      getIndexHeader({
        header: mockHeaderControl,
        defaultIndex: 'default-index',
        workspace: workspaceObject,
        workspaceEnabled: true,
      })
    );

    expect(queryByText('Set as default index')).toBeNull();
  });

  it('does not render the set default button when index is not default and user is not in workspace', () => {
    // @ts-expect-error TS7031 TODO(ts-error): fixme
    const mockHeaderControl = ({ controls }) => {
      return controls?.[1]?.label ?? null;
    };
    const { queryByText } = render(
      getIndexHeader({
        header: mockHeaderControl,
        defaultIndex: 'no-default-index',
        workspaceEnabled: true,
      })
    );

    expect(queryByText('Set as default index')).toBeNull();
  });

  it('does not render the set default button when index is default and user is not in workspace', () => {
    // @ts-expect-error TS7031 TODO(ts-error): fixme
    const mockHeaderControl = ({ controls }) => {
      return controls?.[1]?.label ?? null;
    };
    const { queryByText } = render(
      getIndexHeader({
        header: mockHeaderControl,
        defaultIndex: 'default-index',
        workspaceEnabled: true,
      })
    );

    expect(queryByText('Set as default index')).toBeNull();
  });

  it('renders dataset title when no displayName exists', () => {
    const mockHeaderControl = () => null;
    const setDefault = jest.fn();
    const refreshFields = jest.fn();
    const deleteDatasetClick = jest.fn();
    const { Provider } = createOpenSearchDashboardsReactContext({
      ...mockCoreStart,
      ...{
        uiSettings: { ...mockCoreStart.uiSettings, get: jest.fn().mockReturnValue(false) },
        navigationUI: {
          HeaderControl: mockHeaderControl,
        },
      },
    });

    const { getByTestId } = render(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <Provider>
          <IndexHeader
            setDefault={setDefault}
            refreshFields={refreshFields}
            deleteDatasetClick={deleteDatasetClick}
            dataset={dataset}
            defaultIndex="no-default-index"
          />
        </Provider>
      </IntlProvider>
    );

    const titleElement = getByTestId('datasetTitle');
    expect(titleElement).toHaveTextContent('Test Index Pattern');
  });

  it('renders dataset displayName when it exists', () => {
    const datasetWithDisplayName = {
      ...dataset,
      displayName: 'Custom Display Name',
    };

    const mockHeaderControl = () => null;
    const setDefault = jest.fn();
    const refreshFields = jest.fn();
    const deleteDatasetClick = jest.fn();
    const { Provider } = createOpenSearchDashboardsReactContext({
      ...mockCoreStart,
      ...{
        uiSettings: { ...mockCoreStart.uiSettings, get: jest.fn().mockReturnValue(false) },
        navigationUI: {
          HeaderControl: mockHeaderControl,
        },
      },
    });

    const { getByTestId } = render(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <Provider>
          <IndexHeader
            setDefault={setDefault}
            refreshFields={refreshFields}
            deleteDatasetClick={deleteDatasetClick}
            dataset={datasetWithDisplayName}
            defaultIndex="no-default-index"
          />
        </Provider>
      </IntlProvider>
    );

    const titleElement = getByTestId('datasetTitle');
    expect(titleElement).toHaveTextContent('Custom Display Name');
  });
});
