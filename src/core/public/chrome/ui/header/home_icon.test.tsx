/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { HomeIcon } from './home_icon';
import { getLogosMock } from '../../../../common/mocks';

const mockTitle = 'Page Title';

describe('Home icon,', () => {
  describe('unbranded,', () => {
    const mockProps = () => ({
      branding: {},
      logos: getLogosMock.default,
    });

    it('uses the home icon by default', () => {
      const props = mockProps();
      const component = shallow(<HomeIcon {...props} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('data-test-subj')).toEqual('homeIcon');
      expect(icon.prop('type')).toEqual('home');
      expect(icon.prop('size')).toEqual('m');
      expect(icon.prop('title')).toEqual('opensearch dashboards home');
    });

    it('uses the home icon when header is expanded', () => {
      const props = {
        ...mockProps(),
        branding: {
          useExpandedHeader: true,
        },
      };
      const component = shallow(<HomeIcon {...props} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('data-test-subj')).toEqual('homeIcon');
      expect(icon.prop('type')).toEqual('home');
      expect(icon.prop('size')).toEqual('m');
      expect(icon.prop('title')).toEqual('opensearch dashboards home');

      expect(component).toMatchSnapshot();
    });

    it('uses the mark logo when header is not expanded', () => {
      const props = {
        ...mockProps(),
        branding: {
          useExpandedHeader: false,
        },
      };
      const component = shallow(<HomeIcon {...props} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('data-test-subj')).toEqual('defaultMark');
      expect(icon.prop('type')).toEqual(props.logos.Mark.url);
      expect(icon.prop('size')).toEqual('l');
      expect(icon.prop('title')).toEqual('opensearch dashboards home');

      expect(component).toMatchSnapshot();
    });
  });

  describe('custom branded,', () => {
    const mockProps = () => ({
      branding: {
        applicationTitle: mockTitle,
      },
      logos: getLogosMock.branded,
    });

    it('uses the custom logo by default', () => {
      const props = mockProps();
      const component = shallow(<HomeIcon {...props} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('data-test-subj')).toEqual('customMark');
      expect(icon.prop('type')).toEqual(props.logos.Mark.url);
      expect(icon.prop('size')).toEqual('l');
      expect(icon.prop('title')).toEqual(`${mockTitle} home`);
    });

    it('uses the custom logo when header is expanded', () => {
      const props = mockProps();
      // @ts-expect-error
      props.branding.useExpandedHeader = true;

      const component = shallow(<HomeIcon {...props} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('data-test-subj')).toEqual('customMark');
      expect(icon.prop('type')).toEqual(props.logos.Mark.url);
      expect(icon.prop('size')).toEqual('l');
      expect(icon.prop('title')).toEqual(`${mockTitle} home`);

      expect(component).toMatchSnapshot();
    });

    it('uses the custom logo when header is not expanded', () => {
      const props = mockProps();
      // @ts-expect-error
      props.branding.useExpandedHeader = false;

      const component = shallow(<HomeIcon {...props} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('data-test-subj')).toEqual('customMark');
      expect(icon.prop('type')).toEqual(props.logos.Mark.url);
      expect(icon.prop('size')).toEqual('l');
      expect(icon.prop('title')).toEqual(`${mockTitle} home`);

      expect(component).toMatchSnapshot();
    });
  });
});
