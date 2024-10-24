/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { coreMock } from '../../../../core/public/mocks';
import { DEFAULT_DATA } from '../../../data/common';
import { dataPluginMock } from '../../../data/public/mocks';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { FieldTypeToleranceInfoIcon } from './field_type_tolerance_info_icon';

jest.mock('../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

const coreSetupMock = coreMock.createSetup();
const dataMock = dataPluginMock.createSetupContract();
const getQueryMock = dataMock.query.queryString.getQuery as jest.Mock;
const startMock = coreMock.createStart();

describe('FieldTypeToleranceInfoIcon', () => {
  const renderComponent = () =>
    render(
      <IntlProvider locale="en">
        <FieldTypeToleranceInfoIcon core={coreSetupMock} data={dataMock} />
      </IntlProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.useFakeTimers();
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: startMock });
  });

  it('should render null when datasource is not OpenSearch', async () => {
    getQueryMock.mockReturnValueOnce({ dataset: { dataSource: { type: 'S3' } } });
    const { container } = renderComponent();
    jest.runAllTimers();

    await waitFor(() => expect(coreSetupMock.http.post).not.toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('should render null when field type tolerance is enabled', async () => {
    coreSetupMock.http.post.mockResolvedValueOnce({
      persistent: { 'plugins.query.field_type_tolerance': 'true' },
      transient: {},
    });
    getQueryMock.mockReturnValueOnce({
      dataset: { dataSource: { type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH } },
    });

    const { container } = renderComponent();
    jest.runAllTimers();

    await waitFor(() => expect(coreSetupMock.http.post).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('should show popover if field type tolerance is disabled', async () => {
    coreSetupMock.http.post.mockResolvedValueOnce({
      persistent: { 'plugins.query.field_type_tolerance': 'false' },
      transient: {},
    });
    getQueryMock.mockReturnValueOnce({
      dataset: { dataSource: { type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH } },
    });

    const { getByRole, queryByText } = renderComponent();
    jest.runAllTimers();

    await waitFor(() => expect(getByRole('button')).toBeInTheDocument());
    fireEvent.click(getByRole('button'));
    expect(queryByText('No array datatype support')).toBeInTheDocument();
  });
});
