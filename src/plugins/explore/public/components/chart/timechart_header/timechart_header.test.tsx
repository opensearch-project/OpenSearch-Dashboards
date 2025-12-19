/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ReactWrapper } from 'enzyme';
import { TimechartHeader, TimechartHeaderProps } from './timechart_header';
import { EuiIconTip } from '@elastic/eui';
import { findTestSubject } from 'test_utils/helpers';
import { DiscoverChartToggleId } from '../utils/use_persist_chart_state';

jest.mock('../../../application/context/dataset_context/dataset_context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../utils/breakdown_utils', () => ({
  shouldShowBreakdownSelector: jest.fn(),
}));

jest.mock('../breakdown_field_selector', () => ({
  BreakdownFieldSelector: jest.fn(() => <div data-test-subj="breakdownFieldSelector" />),
}));

import { useDatasetContext } from '../../../application/context/dataset_context/dataset_context';
import { shouldShowBreakdownSelector } from '../utils/breakdown_utils';
import { BreakdownFieldSelector } from '../breakdown_field_selector';

describe('timechart header', function () {
  let props: TimechartHeaderProps;
  let component: ReactWrapper<TimechartHeaderProps>;

  const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
  const mockShouldShowBreakdownSelector = shouldShowBreakdownSelector as jest.MockedFunction<
    typeof shouldShowBreakdownSelector
  >;

  beforeAll(() => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
    } as any);
    mockShouldShowBreakdownSelector.mockReturnValue(false);
    props = {
      title: 'Log count',
      timeRange: {
        from: 'May 14, 2020 @ 11:05:13.590',
        to: 'May 14, 2020 @ 11:20:13.590',
      },
      stateInterval: 's',
      options: [
        {
          display: 'Auto',
          val: 'auto',
        },
        {
          display: 'Millisecond',
          val: 'ms',
        },
        {
          display: 'Second',
          val: 's',
        },
      ],
      onChangeInterval: jest.fn(),
      bucketInterval: {
        scaled: undefined,
        description: 'second',
        scale: undefined,
      },
      toggleIdSelected: 'histogram' as DiscoverChartToggleId,
      additionalControl: undefined,
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
    } as any);
    mockShouldShowBreakdownSelector.mockReturnValue(false);
  });

  it('TimechartHeader not renders an info text when the showScaledInfo property is not provided', () => {
    component = mountWithIntl(<TimechartHeader {...props} />);
    expect(component.find(EuiIconTip).length).toBe(0);
  });

  it('TimechartHeader renders an info when bucketInterval.scale is set to true', () => {
    props.bucketInterval!.scaled = true;
    component = mountWithIntl(<TimechartHeader {...props} />);
    expect(component.find(EuiIconTip).length).toBe(1);
  });

  it('should not render interval selector when toggleIdSelected is not histogram and additionalControl is provided', function () {
    const updatedProps = {
      ...props,
      toggleIdSelected: 'summary' as DiscoverChartToggleId,
      additionalControl: <div>Additional Control</div>,
    };
    component = mountWithIntl(<TimechartHeader {...updatedProps} />);
    const intervalSelect = findTestSubject(component, 'discoverIntervalSelect');
    expect(intervalSelect.length).toBe(0);
  });

  it('should render interval selector when toggleIdSelected is not histogram but additionalControl is null', function () {
    const updatedProps = {
      ...props,
      toggleIdSelected: 'summary' as DiscoverChartToggleId,
      additionalControl: undefined,
    };
    component = mountWithIntl(<TimechartHeader {...updatedProps} />);
    const intervalSelect = findTestSubject(component, 'discoverIntervalSelect');
    expect(intervalSelect.length).toBe(1);
  });

  it('should render title text', function () {
    component = mountWithIntl(<TimechartHeader {...props} />);
    const logCountText = findTestSubject(component, 'discoverTimechartHeaderLogCount');
    expect(logCountText.text()).toBe('Log count');
  });

  it('expects to render a dropdown with the interval options', () => {
    component = mountWithIntl(<TimechartHeader {...props} />);
    const dropdown = findTestSubject(component, 'discoverIntervalSelect');
    expect(dropdown.length).toBe(1);
    // @ts-ignore
    const values = dropdown.find('option').map((option) => option.prop('value'));
    expect(values).toEqual(['auto', 'ms', 's']);
    // @ts-ignore
    const labels = dropdown.find('option').map((option) => option.text());
    expect(labels).toEqual(['Auto', 'Millisecond', 'Second']);
  });

  it('should hide interval selector when hideIntervalSelector is true', () => {
    const updatedProps = {
      ...props,
      hideIntervalSelector: true,
    };
    component = mountWithIntl(<TimechartHeader {...updatedProps} />);
    const intervalSelect = findTestSubject(component, 'discoverIntervalSelect');
    expect(intervalSelect.length).toBe(0);
  });

  it('should change the interval', function () {
    component = mountWithIntl(<TimechartHeader {...props} />);
    findTestSubject(component, 'discoverIntervalSelect').simulate('change', {
      target: { value: 'ms' },
    });
    expect(props.onChangeInterval).toHaveBeenCalled();
  });

  it('calls stopPropagation on mouseUp for interval selector', () => {
    component = mountWithIntl(<TimechartHeader {...props} />);

    const intervalSelect = findTestSubject(component, 'discoverIntervalSelect');
    expect(intervalSelect.exists()).toBe(true); // Verify element exists

    const stopPropagation = jest.fn();
    const stopImmediatePropagation = jest.fn();
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(mouseUpEvent, 'stopPropagation', { value: stopPropagation });
    Object.defineProperty(mouseUpEvent, 'stopImmediatePropagation', {
      value: stopImmediatePropagation,
    });

    intervalSelect.simulate('mouseUp', {
      ...mouseUpEvent,
      nativeEvent: mouseUpEvent,
    });

    expect(stopPropagation).toHaveBeenCalled();
    expect(stopImmediatePropagation).toHaveBeenCalled();
  });

  describe('BreakdownFieldSelector', () => {
    it('should not render BreakdownFieldSelector when shouldShowBreakdownSelector returns false', () => {
      mockShouldShowBreakdownSelector.mockReturnValue(false);
      const mockServices = { data: {} };
      const updatedProps = { ...props, services: mockServices };

      component = mountWithIntl(<TimechartHeader {...updatedProps} />);

      expect(findTestSubject(component, 'breakdownFieldSelector').length).toBe(0);
      expect(BreakdownFieldSelector).not.toHaveBeenCalled();
    });

    it('should not render BreakdownFieldSelector when shouldShowBreakdownSelector returns true but services is undefined', () => {
      mockShouldShowBreakdownSelector.mockReturnValue(true);

      component = mountWithIntl(<TimechartHeader {...props} />);

      expect(findTestSubject(component, 'breakdownFieldSelector').length).toBe(0);
      expect(BreakdownFieldSelector).not.toHaveBeenCalled();
    });

    it('should render BreakdownFieldSelector when shouldShowBreakdownSelector returns true and services is provided', () => {
      mockShouldShowBreakdownSelector.mockReturnValue(true);
      const mockServices = { data: {} };
      const updatedProps = { ...props, services: mockServices };

      component = mountWithIntl(<TimechartHeader {...updatedProps} />);

      expect(findTestSubject(component, 'breakdownFieldSelector').length).toBe(1);
      expect(BreakdownFieldSelector).toHaveBeenCalledWith({ services: mockServices }, {});
    });

    it('should not render BreakdownFieldSelector when toggleIdSelected is not histogram and additionalControl is provided', () => {
      mockShouldShowBreakdownSelector.mockReturnValue(true);
      const mockServices = { data: {} };
      const updatedProps = {
        ...props,
        services: mockServices,
        toggleIdSelected: 'summary' as DiscoverChartToggleId,
        additionalControl: <div>Additional Control</div>,
      };

      component = mountWithIntl(<TimechartHeader {...updatedProps} />);

      expect(findTestSubject(component, 'breakdownFieldSelector').length).toBe(0);
      expect(BreakdownFieldSelector).not.toHaveBeenCalled();
    });

    it('should render BreakdownFieldSelector when toggleIdSelected is histogram', () => {
      mockShouldShowBreakdownSelector.mockReturnValue(true);
      const mockServices = { data: {} };
      const updatedProps = {
        ...props,
        services: mockServices,
        toggleIdSelected: 'histogram' as DiscoverChartToggleId,
      };

      component = mountWithIntl(<TimechartHeader {...updatedProps} />);

      expect(findTestSubject(component, 'breakdownFieldSelector').length).toBe(1);
      expect(BreakdownFieldSelector).toHaveBeenCalledWith({ services: mockServices }, {});
    });

    it('should call shouldShowBreakdownSelector with dataset and services from context', () => {
      const mockDataset = { timeFieldName: '@timestamp', fields: [] };
      mockUseDatasetContext.mockReturnValue({
        dataset: mockDataset as any,
        isLoading: false,
      } as any);
      mockShouldShowBreakdownSelector.mockReturnValue(false);
      const mockServices = {
        data: {},
        uiSettings: {
          get: jest.fn().mockImplementation((setting) => {
            if (setting === 'explore:experimental') return true;
          }),
        },
      };

      component = mountWithIntl(<TimechartHeader {...props} services={mockServices} />);

      expect(mockShouldShowBreakdownSelector).toHaveBeenCalledWith(mockDataset, mockServices);
    });
  });
});
