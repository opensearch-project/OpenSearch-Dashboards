/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateDatasetWizard } from './create_dataset_wizard';
import { DataView } from '../../../../data/public';
import { mockManagementPlugin } from '../../mocks';
import { DatasetCreationConfig } from '../..';
import { createComponentWithContext } from '../test_utils';
import { TIME_FIELD_STEP } from './lib';

jest.mock('./components/step_dataset', () => ({ StepDataset: 'StepDataset' }));
jest.mock('./components/step_time_field', () => ({ StepTimeField: 'StepTimeField' }));
jest.mock('./components/header', () => ({ Header: 'Header' }));
jest.mock('./components/loading_state', () => ({ LoadingState: 'LoadingState' }));
jest.mock('./lib/get_indices', () => ({
  getIndices: ({ pattern }: { pattern: string }) => {
    if (pattern === '*') {
      return [{ name: 'local-index' }];
    }
    if (pattern.includes('cluster1')) {
      return [{ name: 'cluster1:remote-index' }];
    }
    if (pattern.includes('cluster2')) {
      return [{ name: 'cluster2:remote-index' }];
    }
    return [];
  },
}));
const routeComponentPropsMock = {
  history: {
    push: jest.fn(),
  } as any,
  location: {} as any,
  match: {} as any,
};
const mockContext = mockManagementPlugin.createDatasetManagmentContext();
mockContext.datasetManagementStart.creation.getType = () => {
  return new DatasetCreationConfig({
    type: 'default',
    name: 'name',
  });
};

describe('CreateDatasetWizard', () => {
  test(`defaults to the loading state`, () => {
    const component = createComponentWithContext(
      CreateDatasetWizard,
      { ...routeComponentPropsMock },
      mockContext
    );

    expect(component).toMatchSnapshot();
  });

  test('renders the empty state when there are no indices', async () => {
    const component = createComponentWithContext(
      CreateDatasetWizard,
      { ...routeComponentPropsMock },
      mockContext
    );

    component.setState({
      isInitiallyLoadingIndices: false,
      allIndices: [],
      remoteClustersExist: false,
    });

    await component.update();
    expect(component).toMatchSnapshot();
  });

  test('renders when there are no indices but there are remote clusters', async () => {
    const component = createComponentWithContext(
      CreateDatasetWizard,
      { ...routeComponentPropsMock },
      mockContext
    );

    component.setState({
      isInitiallyLoadingIndices: false,
      allIndices: [],
      remoteClustersExist: true,
    });

    await component.update();
    expect(component).toMatchSnapshot();
  });

  test('shows system indices even if there are no other indices if the include system indices is toggled', async () => {
    const component = createComponentWithContext(
      CreateDatasetWizard,
      { ...routeComponentPropsMock },
      mockContext
    );

    component.setState({
      isInitiallyLoadingIndices: false,
      isIncludingSystemIndices: true,
      allIndices: [{ name: '.kibana ' }],
    });

    await component.update();
    expect(component).toMatchSnapshot();
  });

  test('renders index pattern step when there are indices', async () => {
    const component = createComponentWithContext(
      CreateDatasetWizard,
      { ...routeComponentPropsMock },
      mockContext
    );

    component.setState({
      isInitiallyLoadingIndices: false,
      allIndices: [{ name: 'myDataset' }],
    });

    await component.update();
    expect(component).toMatchSnapshot();
  });

  test('renders time field step when step is set to TIME_FIELD_STEP', async () => {
    const component = createComponentWithContext(
      CreateDatasetWizard,
      { ...routeComponentPropsMock },
      mockContext
    );

    component.setState({
      isInitiallyLoadingIndices: false,
      allIndices: [{ name: 'myDataset' }],
      step: TIME_FIELD_STEP,
    });

    await component.update();
    expect(component).toMatchSnapshot();
  });

  test('invokes the provided services when creating an index pattern', async () => {
    const newDatasetAndSave = jest.fn().mockImplementation(async () => {
      return dataset;
    });
    const clear = jest.fn();
    mockContext.data.dataViews.clearCache = clear;
    const dataset = ({
      id: '1',
      title: 'my-fake-index-pattern',
      timeFieldName: 'timestamp',
      fields: [],
      _fetchFields: jest.fn(),
    } as unknown) as DataView;
    mockContext.data.dataViews.createAndSave = newDatasetAndSave;
    mockContext.data.dataViews.setDefault = jest.fn();

    const component = createComponentWithContext(
      CreateDatasetWizard,
      { ...routeComponentPropsMock },
      mockContext
    );

    component.setState({ dataset: 'foo' });
    await (component.instance() as CreateDatasetWizard).createDataset(undefined, 'id', undefined);
    expect(newDatasetAndSave).toBeCalled();
    expect(clear).toBeCalledWith('1');
    expect(routeComponentPropsMock.history.push).toBeCalledWith(`/patterns/1`);
  });

  test('should render normally when use update UX', () => {
    mockContext.uiSettings.get = jest.fn().mockReturnValue(true);
    const component = createComponentWithContext(
      CreateDatasetWizard,
      { ...routeComponentPropsMock },
      mockContext
    );

    expect(component).toMatchSnapshot();
  });

  test('fetches remote indices for each related connection', async () => {
    const component = createComponentWithContext(
      CreateDatasetWizard,
      { ...routeComponentPropsMock },
      mockContext
    );

    // Setup mock data source with related connections
    const dataSourceRef = {
      id: 'test-datasource',
      title: 'Test DataSource',
      type: 'datasource',
      relatedConnections: [{ title: 'cluster1' }, { title: 'cluster2' }],
    };

    // Set initial state with data source reference
    component.setState({
      isInitiallyLoadingIndices: false,
      dataSourceRef,
      allIndices: [{ name: 'local-index' }],
    });

    // Call fetchData manually since we're setting state directly
    await (component.instance() as CreateDatasetWizard).fetchData();

    // Verify the state contains combined indices
    return new Promise((resolve) => {
      setImmediate(() => {
        const state = component.state() as any;
        expect(state.allIndices).toEqual(
          expect.arrayContaining([
            { name: 'local-index' },
            { name: 'cluster1:remote-index' },
            { name: 'cluster2:remote-index' },
          ])
        );
        expect(state.allIndices.length).toBe(3);
        resolve(undefined);
      });
    });
  });
});
