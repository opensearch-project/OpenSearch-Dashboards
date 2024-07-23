/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SavedQueryManagementComponent } from './saved_query_management_component';
import { shallowWithIntl } from 'test_utils/enzyme_helpers';

const mockProps = () => ({
  savedQueryService: {
    saveQuery: jest.fn(),
    getAllSavedQueries: jest.fn(),
    findSavedQueries: jest.fn(),
    getSavedQuery: jest.fn(),
    deleteSavedQuery: jest.fn(),
    getSavedQueryCount: jest.fn(),
  },
  onSave: jest.fn(),
  onSaveAsNew: jest.fn(),
  onLoad: jest.fn(),
  onClearSavedQuery: jest.fn(),
});

describe('Saved query management component', () => {
  it('has a popover button', () => {
    const props = {
      ...mockProps(),
    };
    const component = shallowWithIntl(<SavedQueryManagementComponent {...props} />);
    const savedQueryPopoverButton = component.find('#savedQueryPopover');
    expect(savedQueryPopoverButton).toMatchSnapshot();
  });
});
