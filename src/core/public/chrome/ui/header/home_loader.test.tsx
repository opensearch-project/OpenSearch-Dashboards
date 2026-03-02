/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { getLogosMock } from '../../../../common/mocks';
import { mountWithIntl, shallowWithIntl } from 'test_utils/enzyme_helpers';
import { HomeLoader } from './home_loader';
import { LoadingIndicator } from '../loading_indicator';
import { EuiToolTip } from '@elastic/eui';
import { HomeIcon } from './home_icon';

const mockProps = () => ({
  href: '/',
  navLinks$: new BehaviorSubject([]),
  forceNavigation$: new BehaviorSubject(false),
  navigateToApp: jest.fn(),
  logos: getLogosMock.default,
  branding: {},
});

describe('Home loader', () => {
  it('shows the loading indicator if loading count > 0', () => {
    const props = {
      ...mockProps(),
      loadingCount$: new BehaviorSubject(1),
    };
    const component = shallowWithIntl(<HomeLoader {...props} />);
    const loadingIndicator = component.find(LoadingIndicator);
    expect(loadingIndicator.exists()).toBeTruthy();
    expect(loadingIndicator.prop('loadingCount$')).toEqual(props.loadingCount$);
    expect(component).toMatchSnapshot();
  });
  it('displays a EuiToolTip', () => {
    const props = {
      ...mockProps(),
      loadingCount$: new BehaviorSubject(0),
    };
    const component = shallowWithIntl(<HomeLoader {...props} />);
    const toolTip = component.find(EuiToolTip);
    expect(toolTip.exists()).toBeTruthy();
    expect(component).toMatchSnapshot();
  });
  describe('onClick', () => {
    it('directs to home page', () => {
      const props = {
        ...mockProps(),
        loadingCount$: new BehaviorSubject(0),
      };
      const component = mountWithIntl(<HomeLoader {...props} />);
      const homeIcon = component.find(HomeIcon);
      expect(homeIcon.exists()).toBeTruthy();
      homeIcon.simulate('click');
      expect(props.navigateToApp).toHaveBeenCalledTimes(1);
      expect(props.navigateToApp).toHaveBeenCalledWith('wz-home');
    });
  });
});
