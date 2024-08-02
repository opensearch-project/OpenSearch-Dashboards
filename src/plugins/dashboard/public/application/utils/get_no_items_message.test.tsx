/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getNoItemsMessage } from './get_no_items_message';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ApplicationStart } from 'opensearch-dashboards/public';

describe('dashboard listing table with no item', () => {
  test('and no write controls', () => {
    const component = mountWithIntl(getNoItemsMessage(true, jest.fn(), {} as ApplicationStart));

    expect(component).toMatchSnapshot();
  });
});
