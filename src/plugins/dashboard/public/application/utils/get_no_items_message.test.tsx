/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getNoItemsMessage } from './get_no_items_message';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ApplicationStart, Capabilities, PublicAppInfo } from 'opensearch-dashboards/public';
import { EuiLink } from '@elastic/eui';
import { RecursiveReadonly } from '@osd/utility-types';
import { Observable } from 'rxjs';

describe('dashboard listing table with no item', () => {
  test('and no write controls', () => {
    const component = mountWithIntl(getNoItemsMessage(true, jest.fn(), {} as ApplicationStart));

    expect(component).toMatchSnapshot();
  });

  test('and with write controls', () => {
    const application = {
      capabilities: {} as RecursiveReadonly<Capabilities>,
      applications$: {} as Observable<ReadonlyMap<string, PublicAppInfo>>,
      navigateToApp: jest.fn(),
      navigateToUrl: jest.fn(),
      getUrlForApp: jest.fn(),
      registerMountContext: jest.fn(),
      currentAppId$: {} as Observable<string | undefined>,
    };
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const component = mountWithIntl(getNoItemsMessage(false, jest.fn(), application));

    expect(component).toMatchSnapshot();
    component.find(EuiLink).simulate('click');

    expect(application.navigateToApp).toHaveBeenCalledWith('import_sample_data');
  });
});
