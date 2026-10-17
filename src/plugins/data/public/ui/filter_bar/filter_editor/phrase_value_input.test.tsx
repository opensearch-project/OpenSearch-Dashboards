/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { IFieldType, IIndexPattern } from '../../..';
import { PhraseValueInput } from './phrase_value_input';

describe('Phrase value input', () => {
  it('uses the configured date format for date fields', () => {
    const dateFormat = 'YYYY-MM-DD HH:mm:ss';
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider
        services={
          {
            uiSettings: { get: () => dateFormat },
          } as any
        }
      >
        <PhraseValueInput
          field={{ name: '@timestamp', type: 'date' } as IFieldType}
          indexPattern={{ id: 'logs-*' } as IIndexPattern}
          onChange={jest.fn()}
        />
      </OpenSearchDashboardsContextProvider>
    );

    expect(component.find('EuiDatePicker').prop('dateFormat')).toBe(dateFormat);
  });
});
