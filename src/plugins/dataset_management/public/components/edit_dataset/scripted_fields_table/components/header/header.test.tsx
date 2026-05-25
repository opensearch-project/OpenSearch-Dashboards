/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from 'enzyme';
import { RouteComponentProps } from 'react-router-dom';
import { ScopedHistory } from 'opensearch-dashboards/public';
import { scopedHistoryMock } from '../../../../../../../../core/public/mocks';
import { Header } from './header';
import { I18nProvider } from '@osd/i18n/react';

describe('Header', () => {
  test('should render normally', () => {
    const component = render(
      <I18nProvider>
        <Header.WrappedComponent
          datasetId="test"
          history={(scopedHistoryMock.create() as unknown) as ScopedHistory}
          location={({} as unknown) as RouteComponentProps['location']}
          match={({} as unknown) as RouteComponentProps['match']}
          useUpdatedUX
        />
      </I18nProvider>
    );

    expect(component).toMatchSnapshot();
  });

  test('should match snapshot when useUpdatedUX equal false', () => {
    const component = render(
      <I18nProvider>
        <Header.WrappedComponent
          datasetId="test"
          history={(scopedHistoryMock.create() as unknown) as ScopedHistory}
          location={({} as unknown) as RouteComponentProps['location']}
          match={({} as unknown) as RouteComponentProps['match']}
          useUpdatedUX={false}
        />
      </I18nProvider>
    );

    expect(component).toMatchSnapshot();
  });
});
