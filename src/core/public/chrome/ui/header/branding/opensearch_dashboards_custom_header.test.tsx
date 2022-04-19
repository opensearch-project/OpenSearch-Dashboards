/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { CustomHeader } from './opensearch_dashboards_custom_header';

describe('Styled header', () => {
  describe('in default mode ', () => {
    it('rendered using header background default color', () => {
      const props = {
        branding: {
          darkMode: false,
          headerBackground: {
            defaultColor: '#000000',
          },
          headerLink: {},
          headerBorder: {},
        },
      };

      const component = mountWithIntl(<CustomHeader {...props} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using header link default color', () => {
      const props = {
        branding: {
          darkMode: false,
          headerBackground: {},
          headerLink: {
            defaultColor: '#000000',
          },
          headerBorder: {},
        },
      };

      const component = mountWithIntl(<CustomHeader {...props} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using header border default color', () => {
      const props = {
        branding: {
          darkMode: false,
          headerBackground: {},
          headerLink: {},
          headerBorder: {
            defaultColor: '#000000',
          },
        },
      };

      const component = mountWithIntl(<CustomHeader {...props} />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in dark mode ', () => {
    it('rendered using header background dark mode color', () => {
      const props = {
        branding: {
          darkMode: true,
          headerBackground: {
            defaultColor: '#000000',
            darkModeColor: '#FFFFFF',
          },
          headerLink: {},
          headerBorder: {},
        },
      };

      const component = mountWithIntl(<CustomHeader {...props} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using header background default color', () => {
      const props = {
        branding: {
          darkMode: true,
          headerBackground: {
            defaultColor: '#000000',
          },
          headerLink: {},
          headerBorder: {},
        },
      };

      const component = mountWithIntl(<CustomHeader {...props} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using header link dark mode color', () => {
      const props = {
        branding: {
          darkMode: true,
          headerBackground: {},
          headerLink: {
            defaultColor: '#000000',
            darkModeColor: '#FFFFFF',
          },
          headerBorder: {},
        },
      };

      const component = mountWithIntl(<CustomHeader {...props} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using header link default color', () => {
      const props = {
        branding: {
          darkMode: true,
          headerBackground: {},
          headerLink: {
            defaultColor: '#000000',
          },
          headerBorder: {},
        },
      };

      const component = mountWithIntl(<CustomHeader {...props} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using header border dark mode color', () => {
      const props = {
        branding: {
          darkMode: true,
          headerBackground: {},
          headerLink: {},
          headerBorder: {
            defaultColor: '#000000',
            darkModeColor: '#FFFFFF',
          },
        },
      };

      const component = mountWithIntl(<CustomHeader {...props} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using header border default color', () => {
      const props = {
        branding: {
          darkMode: true,
          headerBackground: {},
          headerLink: {},
          headerBorder: {
            defaultColor: '#000000',
          },
        },
      };

      const component = mountWithIntl(<CustomHeader {...props} />);
      expect(component).toMatchSnapshot();
    });
  });
});
