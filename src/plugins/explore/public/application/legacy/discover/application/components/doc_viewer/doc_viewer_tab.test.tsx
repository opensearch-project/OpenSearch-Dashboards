/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { DocViewerTab, DocViewerTabProps } from './doc_viewer_tab';
import { DocViewRenderProps } from '../../doc_views/doc_views_types';

test('DocViewerTab updated when getting new renderProps', () => {
  const MockComp = ({ columns }: DocViewRenderProps) => (
    <div data-test-subj="test-div">{columns![0]}</div>
  );

  const mockProps: DocViewerTabProps = {
    id: 1,
    title: 'Test1',
    component: MockComp,
    renderProps: {
      hit: { _id: '1' },
      columns: ['test1'],
    },
  };

  const wrapper = mount(<DocViewerTab {...mockProps} />);

  const div = wrapper.find({ 'data-test-subj': 'test-div' });
  expect(div.text()).toEqual('test1');

  mockProps.renderProps = { hit: { _id: '1' }, columns: ['test2'] };
  wrapper.setProps(mockProps);
  expect(div.text()).toEqual('test2');
});
