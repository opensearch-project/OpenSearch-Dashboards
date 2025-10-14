/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ReactWrapper } from 'enzyme';
import { FieldStatsRowDetails } from './field_stats_row_details';
import { FieldStatsItem, FieldDetails } from './utils/field_stats_types';
import { EuiCallOut, EuiLoadingSpinner } from '@elastic/eui';
import { getApplicableSections } from './utils/field_stats_utils';

jest.mock('./utils/field_stats_utils', () => ({
  getApplicableSections: jest.fn(() => []),
}));

jest.mock('./field_stats_detail_sections', () => ({
  DETAIL_SECTIONS: [],
}));

const mockField: FieldStatsItem = {
  name: 'testField',
  type: 'string',
  docCount: 100,
  distinctCount: 50,
  docPercentage: 80,
};

const mockDetails: FieldDetails = {
  topValues: [
    { value: 'value1', count: 30 },
    { value: 'value2', count: 20 },
  ],
};

describe('FieldStatsRowDetails', () => {
  let component: ReactWrapper;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    component = mountWithIntl(<FieldStatsRowDetails field={mockField} details={mockDetails} />);
    expect(component).toBeDefined();
  });

  it('displays warning when field is not provided', () => {
    component = mountWithIntl(<FieldStatsRowDetails field={undefined} details={mockDetails} />);
    const callOut = component.find(EuiCallOut);
    expect(callOut.exists()).toBe(true);
    expect(callOut.prop('color')).toBe('warning');
    expect(callOut.prop('title')).toBe('Field information not available');
  });

  it('displays loading state when isLoading is true', () => {
    component = mountWithIntl(
      <FieldStatsRowDetails field={mockField} details={mockDetails} isLoading={true} />
    );
    const spinner = component.find(EuiLoadingSpinner);
    expect(spinner.exists()).toBe(true);
    expect(component.text()).toContain('Loading details...');
  });

  it('displays error state when details has error', () => {
    const errorDetails: FieldDetails = { error: true };
    component = mountWithIntl(<FieldStatsRowDetails field={mockField} details={errorDetails} />);
    const callOut = component.find(EuiCallOut);
    expect(callOut.exists()).toBe(true);
    expect(callOut.prop('color')).toBe('danger');
    expect(callOut.prop('title')).toBe('Failed to load details');
  });

  it('displays message when no applicable sections', () => {
    (getApplicableSections as jest.Mock).mockReturnValue([]);
    component = mountWithIntl(<FieldStatsRowDetails field={mockField} details={mockDetails} />);
    const callOut = component.find(EuiCallOut);
    expect(callOut.exists()).toBe(true);
    expect(callOut.prop('title')).toBe('No details available for this field type');
  });

  it('displays message when no data is available', () => {
    const MockComponent = () => <div>Mock Section</div>;
    const mockSections = [
      {
        id: 'topValues',
        title: 'Top Values',
        applicableToTypes: ['string'],
        fetchData: jest.fn(),
        component: MockComponent,
      },
    ];
    (getApplicableSections as jest.Mock).mockReturnValue(mockSections);

    const emptyDetails: FieldDetails = {};
    component = mountWithIntl(<FieldStatsRowDetails field={mockField} details={emptyDetails} />);
    const callOut = component.find(EuiCallOut);
    expect(callOut.exists()).toBe(true);
    expect(callOut.prop('title')).toBe('No details available');
    expect(component.text()).toContain('Details could not be retrieved for this field.');
  });

  it('renders detail sections when data is available', () => {
    const MockComponent = ({ data }: any) => (
      <div className="mock-section">{data.length} items</div>
    );
    const mockSections = [
      {
        id: 'topValues',
        title: 'Top Values',
        applicableToTypes: ['string'],
        fetchData: jest.fn(),
        component: MockComponent,
      },
    ];
    (getApplicableSections as jest.Mock).mockReturnValue(mockSections);

    component = mountWithIntl(<FieldStatsRowDetails field={mockField} details={mockDetails} />);
    expect(component.find('.mock-section').exists()).toBe(true);
    expect(component.find('h4').text()).toBe('Top Values');
  });

  it('skips sections with error data', () => {
    const MockComponent = ({ data }: any) => (
      <div className="mock-section">{data.length} items</div>
    );
    const mockSections = [
      {
        id: 'topValues',
        title: 'Top Values',
        applicableToTypes: ['string'],
        fetchData: jest.fn(),
        component: MockComponent,
      },
    ];
    (getApplicableSections as jest.Mock).mockReturnValue(mockSections);

    const detailsWithError: FieldDetails = {
      topValues: { error: true } as any,
    };
    component = mountWithIntl(
      <FieldStatsRowDetails field={mockField} details={detailsWithError} />
    );
    expect(component.find('.mock-section').exists()).toBe(false);
  });

  it('skips sections with empty array data', () => {
    const MockComponent = ({ data }: any) => (
      <div className="mock-section">{data.length} items</div>
    );
    const mockSections = [
      {
        id: 'topValues',
        title: 'Top Values',
        applicableToTypes: ['string'],
        fetchData: jest.fn(),
        component: MockComponent,
      },
    ];
    (getApplicableSections as jest.Mock).mockReturnValue(mockSections);

    const detailsWithEmptyArray: FieldDetails = {
      topValues: [],
    };
    component = mountWithIntl(
      <FieldStatsRowDetails field={mockField} details={detailsWithEmptyArray} />
    );
    expect(component.find('.mock-section').exists()).toBe(false);
  });
});
