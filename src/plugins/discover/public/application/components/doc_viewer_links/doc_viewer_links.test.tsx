/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { DocViewerLinks } from './doc_viewer_links';
import { getDocViewsLinksRegistry } from '../../../opensearch_dashboards_services';
import { DocViewLinkRenderProps } from '../doc_views/doc_views_links/doc_views_links_types';

jest.mock('../../../opensearch_dashboards_services', () => {
  let registry: any[] = [];
  return {
    getDocViewsLinksRegistry: () => ({
      addDocViewLink(view: any) {
        registry.push(view);
      },
      getDocViewsLinksSorted() {
        return registry;
      },
      resetRegistry: () => {
        registry = [];
      },
    }),
  };
});

beforeEach(() => {
  (getDocViewsLinksRegistry() as any).resetRegistry();
  jest.clearAllMocks();
});

test('Render <DocViewerLink/> with 2 different links', () => {
  const registry = getDocViewsLinksRegistry();
  registry.addDocViewLink({
    order: 10,
    label: 'generateCb link',
    generateCb: () => ({
      url: 'aaa',
    }),
  });
  registry.addDocViewLink({ order: 20, label: 'href link', href: 'bbb' });

  const renderProps = { hit: {} } as DocViewLinkRenderProps;

  const wrapper = shallow(<DocViewerLinks {...renderProps} />);

  expect(wrapper).toMatchSnapshot();
});

test('Dont Render <DocViewerLink/> if generateCb.hide', () => {
  const registry = getDocViewsLinksRegistry();
  registry.addDocViewLink({
    order: 10,
    label: 'generateCb link',
    generateCb: () => ({
      url: 'aaa',
      hide: true,
    }),
  });

  const renderProps = { hit: {} } as DocViewLinkRenderProps;

  const wrapper = shallow(<DocViewerLinks {...renderProps} />);

  expect(wrapper).toMatchSnapshot();
});
