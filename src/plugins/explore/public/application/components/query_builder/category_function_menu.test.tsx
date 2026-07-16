/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryFunctionMenu, FunctionCategory } from './category_function_menu';

// The real EuiContextMenu drills between panels with a CSS transition whose
// `transitionend` never fires in jsdom, so the incoming panel never renders.
// Mock it with synchronous panel navigation: an item with a `panel` id drills
// into that panel; an item with `onClick` invokes it. Panel titles and item
// names (which may be React nodes) are rendered so tests can query by text.
jest.mock('@elastic/eui', () => {
  const actual = jest.requireActual('@elastic/eui');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useState } = require('react');
  const MockContextMenu = ({ initialPanelId, panels }: any) => {
    const [panelId, setPanelId] = useState(initialPanelId);
    const panel = panels.find((p: any) => p.id === panelId);
    return (
      <div>
        {panel.title && <div>{panel.title}</div>}
        {panel.items.map((item: any, i: number) => (
          <button
            key={i}
            type="button"
            onClick={() => (item.panel !== undefined ? setPanelId(item.panel) : item.onClick?.())}
          >
            {item.name}
          </button>
        ))}
      </div>
    );
  };
  return { ...actual, EuiContextMenu: MockContextMenu };
});

const categories: FunctionCategory[] = [
  {
    name: 'Math',
    items: [
      { id: 'abs', name: 'abs', params: ['x'], description: 'Absolute value' },
      { id: 'ceil', name: 'ceil', params: ['x'], description: 'Round up' },
    ],
  },
  {
    name: 'Text',
    items: [{ id: 'upper', name: 'upper', params: ['s'], description: 'Uppercase' }],
  },
];

describe('CategoryFunctionMenu', () => {
  it('renders an empty-kind trigger with its label and does not show the menu until opened', () => {
    render(
      <CategoryFunctionMenu
        categories={categories}
        onSelect={jest.fn()}
        trigger={{ kind: 'empty', label: 'Add function' }}
        dataTestSubj="fnMenu"
      />
    );
    expect(screen.getByTestId('fnMenu')).toHaveTextContent('Add function');
    // Popover is closed: category names are not in the DOM yet.
    expect(screen.queryByText('Math')).not.toBeInTheDocument();
  });

  it('renders an icon-kind trigger with its aria-label', () => {
    render(
      <CategoryFunctionMenu
        categories={categories}
        onSelect={jest.fn()}
        trigger={{ kind: 'icon', iconType: 'plus', ariaLabel: 'Add function' }}
        dataTestSubj="fnMenu"
      />
    );
    expect(screen.getByTestId('fnMenu')).toHaveAttribute('aria-label', 'Add function');
  });

  it('opens the root panel showing categories and drills into a category to select a function', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFunctionMenu
        categories={categories}
        onSelect={onSelect}
        trigger={{ kind: 'empty', label: 'Add function' }}
        dataTestSubj="fnMenu"
      />
    );
    fireEvent.click(screen.getByTestId('fnMenu'));
    // Root panel lists the categories.
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();

    // Drill into Math, then pick a function.
    fireEvent.click(screen.getByText('Math'));
    expect(screen.getByText('Absolute value')).toBeInTheDocument();
    fireEvent.click(screen.getByText('abs'));
    expect(onSelect).toHaveBeenCalledWith(categories[0].items[0]);
  });

  it('renders extra root items with descriptions and fires their onClick', () => {
    const onExtra = jest.fn();
    render(
      <CategoryFunctionMenu
        categories={categories}
        onSelect={jest.fn()}
        trigger={{ kind: 'empty', label: 'Add function' }}
        extraRootItems={[{ name: 'Custom', description: 'Free-form', onClick: onExtra }]}
        rootTitle="Functions"
        dataTestSubj="fnMenu"
      />
    );
    fireEvent.click(screen.getByTestId('fnMenu'));
    expect(screen.getByText('Functions')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Free-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Custom'));
    expect(onExtra).toHaveBeenCalledTimes(1);
  });
});
