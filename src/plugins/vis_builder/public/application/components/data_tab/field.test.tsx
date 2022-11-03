/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import { IndexPatternField } from '../../../../../data/public';

import { DraggableFieldButton } from './field';

describe('visBuilder field', function () {
  describe('DraggableFieldButton', () => {
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
      render(<DraggableFieldButton {...props} />);

      const button = screen.getByTestId('field-bytes-showDetails');

      expect(button).toBeDefined();
    });

    // TODO: it('should allow specified dragValue to override the field name');

    // TODO: it('should make dots wrappable');

    // TODO: it('should use a non-scripted FieldIcon by default');
  });

  // TODO: describe('Field', function () { });
});
