/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { TransformPanel } from './transform_panel';
import { TransformationService } from './transformation_service';
import { TransformationInstance, TransformationPipeline } from './types';

jest.mock('./transform_selector_overlay', () => ({
  TransformSelectorButton: ({ onSelectTransformation }: any) => (
    <button
      data-test-subj="transformPanelAddButton"
      onClick={() => onSelectTransformation('limit')}
    >
      Add
    </button>
  ),
}));

const createMockInstance = (id: string, definitionId = 'limit'): TransformationInstance => ({
  instance_id: id,
  definition_id: definitionId,
  config: {},
  hide: false,
  transformationMethod: (data) => data,
  Editor: ({ config, onChange }) => <div data-test-subj={`editor-${id}`}>Editor for {id}</div>,
});

const createMockService = (pipeline: TransformationPipeline = []) => {
  const service = ({
    pipeline$: new BehaviorSubject<TransformationPipeline>(pipeline),
    stageSchemas$: new BehaviorSubject<Map<string, Array<{ name?: string; type?: string }>>>(
      new Map()
    ),
    getDefinition: jest.fn((defId: string) => ({
      id: defId,
      label: defId.charAt(0).toUpperCase() + defId.slice(1),
    })),
    addInstance: jest.fn(),
    removeInstance: jest.fn(),
    updateInstanceConfig: jest.fn(),
    toggleInstanceHide: jest.fn(),
    setPipeline: jest.fn(),
  } as unknown) as TransformationService;
  return service;
};

describe('TransformPanel', () => {
  it('renders empty state when pipeline has no items', () => {
    const service = createMockService([]);
    render(<TransformPanel transformationService={service} />);
    expect(screen.getByText('Add a Transformation')).toBeInTheDocument();
    expect(screen.getByText(/Transformations allow data/)).toBeInTheDocument();
  });

  it('renders transformation cards when pipeline has items', () => {
    const instance = createMockInstance('inst-1', 'limit');
    const service = createMockService([instance]);
    render(<TransformPanel transformationService={service} />);
    expect(screen.getByText('1 - Limit')).toBeInTheDocument();
    expect(screen.getByTestId('editor-inst-1')).toBeInTheDocument();
  });

  it('renders multiple transformation cards with correct numbering', () => {
    const instances = [
      createMockInstance('inst-1', 'limit'),
      createMockInstance('inst-2', 'filter'),
    ];
    const service = createMockService(instances);
    render(<TransformPanel transformationService={service} />);
    expect(screen.getByText('1 - Limit')).toBeInTheDocument();
    expect(screen.getByText('2 - Filter')).toBeInTheDocument();
  });

  it('calls removeInstance when remove button is clicked', () => {
    const instance = createMockInstance('inst-1');
    const service = createMockService([instance]);
    render(<TransformPanel transformationService={service} />);
    fireEvent.click(screen.getByTestId('transformRemoveButton-inst-1'));
    expect(service.removeInstance).toHaveBeenCalledWith('inst-1');
  });

  it('calls toggleInstanceHide when hide button is clicked', () => {
    const instance = createMockInstance('inst-1');
    const service = createMockService([instance]);
    render(<TransformPanel transformationService={service} />);
    fireEvent.click(screen.getByTestId('transformHideButton-inst-1'));
    expect(service.toggleInstanceHide).toHaveBeenCalledWith('inst-1');
  });

  it('calls addInstance via the add button', () => {
    const service = createMockService([]);
    render(<TransformPanel transformationService={service} />);
    fireEvent.click(screen.getByTestId('transformPanelAddButton'));
    expect(service.addInstance).toHaveBeenCalledWith('limit');
  });

  it('does not render empty state when pipeline has items', () => {
    const instance = createMockInstance('inst-1');
    const service = createMockService([instance]);
    render(<TransformPanel transformationService={service} />);
    expect(screen.queryByText('Add a Transformation')).not.toBeInTheDocument();
  });
});
