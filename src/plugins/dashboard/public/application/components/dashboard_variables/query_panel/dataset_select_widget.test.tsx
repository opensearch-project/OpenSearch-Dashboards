/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount } from 'enzyme';

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DEFAULT_DATA, CORE_SIGNAL_TYPES } from '../../../../../../data/common';
import { DatasetSelectWidget } from './dataset_select_widget';

const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.Mock;

// Capture the props the widget passes into the shared DatasetSelect.
let datasetSelectProps: any;
const MockDatasetSelect = (props: any) => {
  datasetSelectProps = props;
  return <div data-test-subj="mockDatasetSelect" />;
};

describe('DatasetSelectWidget', () => {
  beforeEach(() => {
    datasetSelectProps = undefined;
    mockUseOpenSearchDashboards.mockReturnValue({
      services: { data: { ui: { DatasetSelect: MockDatasetSelect } } },
    });
  });

  const renderWidget = (language: string, onDatasetChange = jest.fn(), selectedDataset?: any) => {
    mount(
      <DatasetSelectWidget
        selectedDataset={selectedDataset}
        onDatasetChange={onDatasetChange}
        language={language}
      />
    );
    return onDatasetChange;
  };

  it('always forces controlled mode so it never leaks to the global dashboard dataset', () => {
    renderWidget('PROMQL');
    expect(datasetSelectProps.isControlled).toBe(true);
  });

  it('restricts to Prometheus datasets under PromQL', () => {
    renderWidget('PROMQL');
    expect(datasetSelectProps.supportedTypes).toEqual(['PROMETHEUS']);
    expect(datasetSelectProps.signalType).toBe(CORE_SIGNAL_TYPES.METRICS);
  });

  it('allows index datasets under PPL', () => {
    renderWidget('PPL');
    expect(datasetSelectProps.supportedTypes).toEqual([
      DEFAULT_DATA.SET_TYPES.INDEX,
      DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    ]);
    expect(datasetSelectProps.signalType).toEqual([
      CORE_SIGNAL_TYPES.LOGS,
      CORE_SIGNAL_TYPES.METRICS,
    ]);
  });

  it('passes the selected dataset and selection callback through', () => {
    const selected = { id: 'flights', type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN };
    const onDatasetChange = renderWidget('PPL', jest.fn(), selected);
    expect(datasetSelectProps.controlledSelectedDataset).toBe(selected);

    const picked = { id: 'other', type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN };
    datasetSelectProps.onSelect(picked);
    expect(onDatasetChange).toHaveBeenCalledWith(picked);
  });
});
