/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { DeleteScritpedFieldConfirmationModal } from './confirmation_modal';

describe('DeleteScritpedFieldConfirmationModal', () => {
  test('should render normally', () => {
    const component = shallow(
      <DeleteScritpedFieldConfirmationModal
        field={{ name: '', script: '', lang: '' }}
        deleteField={() => {}}
        hideDeleteConfirmationModal={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
