/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import { IndexPatternField } from '../../../../../data/public';

import { SelectorFieldButton } from './field_selector_field';

describe('visBuilder sidebar field selector field', function () {
  describe('SelectorFieldButton', () => {
    it('should render normal fields without a dragValue specified', async () => {
      const props = {
        field: new IndexPatternField(
          {
            name: 'bytes',
            type: 'number',
            esTypes: ['long'],
            count: 10,
            scripted: false,
            searchable: true,
            aggregatable: true,
            readFromDocValues: true,
          },
          'bytes'
        ),
      };
      render(<SelectorFieldButton {...props} />);

      expect(screen.getByTestId('field-bytes-showDetails')).toBeDefined();
    });

    // it('should allow specified dragValue to override the field name');

    // it('should make dots wrappable');

    // it('should use a non-scripted FieldIcon by default');
  });

  // describe('FieldSelectorField', function () {

  // });
});
