/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { TransformSelectorButton } from './transform_selector_overlay';
import { ITransformationService } from './types';

const createMockService = (): ITransformationService =>
  (({
    getDefinitions: jest.fn(() => [
      {
        id: 'limit',
        type: 'filter',
        label: 'Limit',
        description: 'Limit rows',
        iconType: 'filter',
      },
      {
        id: 'sort_by',
        type: 'sort',
        label: 'Sort By',
        description: 'Sort rows by field',
        iconType: 'sortable',
      },
      {
        id: 'filter',
        type: 'filter',
        label: 'Filter',
        description: 'Filter rows by value',
        iconType: 'filter',
      },
    ]),
  } as unknown) as ITransformationService);

describe('TransformSelectorButton', () => {
  const onSelectTransformation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Add button', () => {
    const service = createMockService();
    render(
      <TransformSelectorButton
        transformationService={service}
        onSelectTransformation={onSelectTransformation}
      />
    );
    expect(screen.getByTestId('transformPanelAddButton')).toBeInTheDocument();
  });

  it('opens flyout when Add button is clicked', () => {
    const service = createMockService();
    render(
      <TransformSelectorButton
        transformationService={service}
        onSelectTransformation={onSelectTransformation}
      />
    );
    fireEvent.click(screen.getByTestId('transformPanelAddButton'));
    expect(screen.getByTestId('transformSelectorPanelFlyout')).toBeInTheDocument();
    expect(screen.getByText('Add Transformation')).toBeInTheDocument();
  });

  it('displays all transformation definitions', () => {
    const service = createMockService();
    render(
      <TransformSelectorButton
        transformationService={service}
        onSelectTransformation={onSelectTransformation}
      />
    );
    fireEvent.click(screen.getByTestId('transformPanelAddButton'));
    expect(screen.getByTestId('transformMethodCard-limit')).toBeInTheDocument();
    expect(screen.getByTestId('transformMethodCard-sort_by')).toBeInTheDocument();
    expect(screen.getByTestId('transformMethodCard-filter')).toBeInTheDocument();
  });

  it('filters transformations by search text', () => {
    const service = createMockService();
    render(
      <TransformSelectorButton
        transformationService={service}
        onSelectTransformation={onSelectTransformation}
      />
    );
    fireEvent.click(screen.getByTestId('transformPanelAddButton'));
    const searchInput = screen.getByPlaceholderText('Search transformations...');
    fireEvent.change(searchInput, { target: { value: 'sort' } });
    expect(screen.getByTestId('transformMethodCard-sort_by')).toBeInTheDocument();
    expect(screen.queryByTestId('transformMethodCard-limit')).not.toBeInTheDocument();
  });

  it('shows no results message when search has no matches', () => {
    const service = createMockService();
    render(
      <TransformSelectorButton
        transformationService={service}
        onSelectTransformation={onSelectTransformation}
      />
    );
    fireEvent.click(screen.getByTestId('transformPanelAddButton'));
    const searchInput = screen.getByPlaceholderText('Search transformations...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getByText('No transformations found.')).toBeInTheDocument();
  });

  it('calls onSelectTransformation and closes flyout when a card is clicked', () => {
    const service = createMockService();
    render(
      <TransformSelectorButton
        transformationService={service}
        onSelectTransformation={onSelectTransformation}
      />
    );
    fireEvent.click(screen.getByTestId('transformPanelAddButton'));
    fireEvent.click(screen.getByTestId('transformMethodCard-limit'));
    expect(onSelectTransformation).toHaveBeenCalledWith('limit');
    expect(screen.queryByTestId('transformSelectorPanelFlyout')).not.toBeInTheDocument();
  });

  it('performs case-insensitive search', () => {
    const service = createMockService();
    render(
      <TransformSelectorButton
        transformationService={service}
        onSelectTransformation={onSelectTransformation}
      />
    );
    fireEvent.click(screen.getByTestId('transformPanelAddButton'));
    const searchInput = screen.getByPlaceholderText('Search transformations...');
    fireEvent.change(searchInput, { target: { value: 'LIMIT' } });
    expect(screen.getByTestId('transformMethodCard-limit')).toBeInTheDocument();
  });
});
