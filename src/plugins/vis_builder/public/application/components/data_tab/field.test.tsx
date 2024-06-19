/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import { IndexPatternField } from '../../../../../data/public';

import { DraggableFieldButton } from './field';
import { DropResult, EuiDragDropContext, EuiDroppable } from '@elastic/eui';

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
      render(
        <EuiDragDropContext onDragEnd={(result: DropResult) => {}}>
          <EuiDroppable droppableId="1">
            <DraggableFieldButton index={1} {...props} />
          </EuiDroppable>
        </EuiDragDropContext>
      );

      const button = screen.getByTestId('field-bytes-showDetails');

      expect(button).toBeDefined();
    });

    // TODO: it('should allow specified dragValue to override the field name');

    // TODO: it('should make dots wrappable');

    // TODO: it('should use a non-scripted FieldIcon by default');
  });

  // TODO: describe('Field', function () { });
});
