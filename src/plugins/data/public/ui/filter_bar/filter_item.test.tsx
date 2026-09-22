/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { act } from 'react';
import { EuiContextMenu, EuiPopover } from '@elastic/eui';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { Filter, FILTERS } from '../../../common';
import { FilterItem } from './filter_item';

describe('FilterItem', () => {
  it('keeps editor overlays unclipped after focus leaves the editor', () => {
    const filter: Filter = {
      meta: {
        alias: null,
        disabled: false,
        key: '@timestamp',
        negate: false,
        type: FILTERS.RANGE,
        value: 'Sep 22, 2026',
      },
      range: {
        '@timestamp': {
          gte: 1790006400000,
          lt: 1790092800000,
        },
      },
    };

    const wrapper = mountWithIntl(
      <FilterItem
        id="timestamp-filter"
        filter={filter}
        indexPatterns={[]}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
        uiSettings={{} as any}
      />
    );

    let contextMenu = wrapper.find(EuiPopover).prop('children') as React.ReactElement<
      React.ComponentProps<typeof EuiContextMenu>
    >;

    const editorForm = document.createElement('div');
    const editorInput = document.createElement('input');
    editorForm.className = 'globalFilterItem__editorForm';
    editorForm.appendChild(editorInput);

    act(() => {
      contextMenu.props.onFocusCapture?.({
        target: editorInput,
      } as React.FocusEvent<HTMLDivElement>);
    });
    wrapper.update();

    contextMenu = wrapper.find(EuiPopover).prop('children') as React.ReactElement<
      React.ComponentProps<typeof EuiContextMenu>
    >;

    document.body.tabIndex = -1;
    document.body.focus();

    expect(contextMenu.props.className).toContain('globalFilterItem__contextMenu--editorActive');
    document.body.removeAttribute('tabindex');
  });
});
