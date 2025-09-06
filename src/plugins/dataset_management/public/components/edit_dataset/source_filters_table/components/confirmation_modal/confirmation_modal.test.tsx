/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { DeleteFilterConfirmationModal } from './confirmation_modal';

describe('Header', () => {
  test('should render normally', () => {
    const component = shallow(
      <DeleteFilterConfirmationModal
        filterToDeleteValue={'test'}
        onCancelConfirmationModal={() => {}}
        onDeleteFilter={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
