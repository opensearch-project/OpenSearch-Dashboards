/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { findTestSubject } from 'test_utils/helpers';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { EventVisItemIcon } from './event_vis_item_icon';
import { EuiPopover } from '@elastic/eui';
import { createPluginResource, createPointInTimeEventsVisLayer } from '../../mocks';

describe('<EventVisItemIcon/>', () => {
  it('shows event count when rendering a PointInTimeEventsVisLayer', async () => {
    const eventCount = 5;
    const pluginResource = createPluginResource();
    const visLayer = createPointInTimeEventsVisLayer('test-plugin', pluginResource, eventCount);
    const { getByTestId, getByText } = render(<EventVisItemIcon visLayer={visLayer} />);
    expect(getByTestId('eventCount')).toBeInTheDocument();
    expect(getByText(eventCount)).toBeInTheDocument();
  });
  it('shows error when rendering a PointInTimeEventsVisLayer with an error', async () => {
    const eventCount = 5;
    const pluginResource = createPluginResource();
    const visLayerWithError = createPointInTimeEventsVisLayer(
      'test-plugin',
      pluginResource,
      eventCount,
      true
    );
    const { getByTestId } = render(<EventVisItemIcon visLayer={visLayerWithError} />);
    expect(getByTestId('errorButton')).toBeInTheDocument();
  });
  it('triggers popout with error message when clicking on error button', async () => {
    const eventCount = 5;
    const pluginResource = createPluginResource();
    const visLayerWithError = createPointInTimeEventsVisLayer(
      'test-plugin',
      pluginResource,
      eventCount,
      true,
      'some-error-message'
    );
    const component = mountWithIntl(<EventVisItemIcon visLayer={visLayerWithError} />);
    const errorButton = findTestSubject(component, 'dangerButton');
    errorButton.simulate('click');
    expect(component.find(EuiPopover).prop('isOpen')).toBe(true);
    expect(component.contains('some-error-message')).toBe(true);
  });
});
