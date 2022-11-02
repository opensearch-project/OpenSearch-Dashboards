/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FilterManager, IndexPatternField } from '../../../../../data/public';
import { FieldGroup } from './field_selector';

const mockGetDetails = jest.fn(() => ({
  buckets: [1, 2, 3].map((n) => ({
    display: `display-${n}`,
    value: `value-${n}`,
    percent: 25,
    count: 100,
  })),
  error: '',
  exists: 100,
  total: 150,
}));

const getFields = (name) => {
  return new IndexPatternField(
    {
      name,
      type: 'number',
      esTypes: ['long'],
      count: 10,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
    },
    name
  );
};

describe('visBuilder sidebar field selector', function () {
  const defaultProps = {
    filterManager: {} as FilterManager,
    getDetails: mockGetDetails,
    header: 'mockHeader',
    id: 'mockID',
  };
  describe('FieldGroup', () => {
    it('renders an empty accordion if no fields specified', async () => {
      const { container } = render(<FieldGroup {...defaultProps} />);

      expect(container).toHaveTextContent(defaultProps.header);
      expect(container).toHaveTextContent('0');
      expect(screen.queryAllByTestId('field-selector-field').length).toBeFalsy();

      await fireEvent.click(screen.getByText(defaultProps.header));

      expect(mockGetDetails).not.toHaveBeenCalled();
    });

    it('renders an accordion with FieldSelectorFields if fields provided', async () => {
      const props = {
        ...defaultProps,
        fields: ['bytes', 'machine.ram', 'memory', 'phpmemory'].map(getFields),
      };
      const { container } = render(<FieldGroup {...props} />);

      expect(container).toHaveTextContent(props.header);
      expect(container).toHaveTextContent(props.fields.length.toString());
      expect(screen.queryAllByTestId('field-selector-field').length).toBe(props.fields.length);

      await fireEvent.click(screen.getByText('memory'));

      expect(mockGetDetails).toHaveBeenCalledTimes(1);
    });
  });
});
