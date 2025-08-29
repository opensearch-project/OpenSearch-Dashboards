/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { renderWithIntl } from 'test_utils/enzyme_helpers';
import { RouteComponentProps } from 'react-router-dom';
import { ScopedHistory } from 'opensearch-dashboards/public';
import { scopedHistoryMock } from '../../../../../../../../core/public/mocks';
import { Header } from './header';

describe('Header', () => {
  test('should render normally', () => {
    const component = renderWithIntl(
      <Header.WrappedComponent
        datasetId="test"
        history={(scopedHistoryMock.create() as unknown) as ScopedHistory}
        location={({} as unknown) as RouteComponentProps['location']}
        match={({} as unknown) as RouteComponentProps['match']}
        useUpdatedUX
      />
    );

    expect(component).toMatchSnapshot();
  });

  test('should match snapshot when useUpdatedUX equal false', () => {
    const component = renderWithIntl(
      <Header.WrappedComponent
        datasetId="test"
        history={(scopedHistoryMock.create() as unknown) as ScopedHistory}
        location={({} as unknown) as RouteComponentProps['location']}
        match={({} as unknown) as RouteComponentProps['match']}
        useUpdatedUX={false}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
