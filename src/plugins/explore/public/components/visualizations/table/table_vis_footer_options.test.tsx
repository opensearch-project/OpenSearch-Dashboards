/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableFooterOptions, TableFooterStyleControlsProps } from './table_vis_footer_options';
import { TableChartStyleControls } from './table_vis_config';
import { AxisRole, AxisColumnMappings, VisColumn, VisFieldType } from '../types';
import { CalculationMethod } from '../utils/calculation';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest
      .fn()
      .mockImplementation(
        (_id: string, { defaultMessage }: { defaultMessage: string }) => defaultMessage
      ),
  },
}));

jest.mock('../style_panel/style_accordion', () => ({
  StyleAccordion: jest.fn(({ children, 'data-test-subj': dataTestSubj }) => (
    <div data-test-subj={dataTestSubj || 'mockStyleAccordion'}>{children}</div>
  )),
}));

jest.mock('@elastic/eui', () => {
  const actual = jest.requireActual('@elastic/eui');

  const EuiPopover = ({
    button,
    isOpen,
    children,
  }: {
    button: React.ReactNode;
    isOpen: boolean;
    children: React.ReactNode;
  }) => (
    <div>
      <div>{button}</div>
      {isOpen ? <div data-test-subj="mockPopover">{children}</div> : null}
    </div>
  );

  const EuiContextMenu = ({
    panels,
  }: {
    panels: Array<{ id: number; items: Array<{ name: string; onClick: () => void }> }>;
  }) => {
    const items = panels?.[0]?.items ?? [];
    return (
      <div data-test-subj="mockContextMenu">
        {items.map((item, idx) => (
          <button key={idx} onClick={item.onClick}>
            {item.name}
          </button>
        ))}
      </div>
    );
  };

  return { ...actual, EuiPopover, EuiContextMenu };
});

const numericalColumns: VisColumn[] = [
  {
    id: 1,
    name: 'Price',
    schema: VisFieldType.Numerical,
    column: 'price',
    validValuesCount: 100,
    uniqueValuesCount: 100,
  },
  {
    id: 2,
    name: 'Count',
    schema: VisFieldType.Numerical,
    column: 'count',
    validValuesCount: 100,
    uniqueValuesCount: 100,
  },
];

const categoricalColumns: VisColumn[] = [
  {
    id: 3,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 50,
    uniqueValuesCount: 10,
  },
];

const axisColumnMappings: AxisColumnMappings = {
  [AxisRole.X]: categoricalColumns[0],
  [AxisRole.Y]: numericalColumns[0],
};

const makeDefaultStyleOptions = (
  overrides?: Partial<TableChartStyleControls>
): TableChartStyleControls => ({
  pageSize: 10,
  globalAlignment: 'auto',
  showColumnFilter: false,
  showFooter: true,
  footerCalculations: [],
  ...overrides,
});

const TestWrapper: React.FC<{
  initialProps: TableFooterStyleControlsProps;
}> = ({ initialProps }) => {
  const [styleOptions, setStyleOptions] = useState(initialProps.styleOptions);

  const onStyleChange = (changes: Partial<TableChartStyleControls>) => {
    setStyleOptions((prev) => ({ ...prev, ...changes }));
    initialProps.onStyleChange(changes);
  };

  return (
    <TableFooterOptions
      {...initialProps}
      styleOptions={styleOptions}
      onStyleChange={onStyleChange}
    />
  );
};

const makeProps = (
  overrides?: Partial<TableFooterStyleControlsProps>
): TableFooterStyleControlsProps => ({
  styleOptions: makeDefaultStyleOptions(),
  onStyleChange: jest.fn(),
  numericalColumns,
  categoricalColumns,
  dateColumns: [],
  axisColumnMappings,
  updateVisualization: jest.fn(),
  ...overrides,
});

describe('TableFooterOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with footer enabled and shows Add Calculation button when available', async () => {
    const props = makeProps();
    render(<TestWrapper initialProps={props} />);

    expect(screen.getByTestId('visTableFooter')).toBeInTheDocument();
    expect(screen.getByTestId('visTableAddCalculation')).toBeInTheDocument();
  });

  test('toggle Show Footer switch off: should call onStyleChange for showFooter', async () => {
    const props = makeProps();
    render(<TestWrapper initialProps={props} />);

    const switchEl = screen.getByTestId('visTableShowFooter');
    await userEvent.click(switchEl);

    expect(props.onStyleChange).toHaveBeenCalledWith({ showFooter: false });
  });

  test('Add Calculation: adds first available field & calculation (total)', async () => {
    const props = makeProps();
    render(<TestWrapper initialProps={props} />);

    await userEvent.click(screen.getByTestId('visTableAddCalculation'));

    await waitFor(() => {
      expect(props.onStyleChange).toHaveBeenCalledWith({
        footerCalculations: [{ fields: ['price'], calculation: 'total' as CalculationMethod }],
      });
    });
  });

  test('Change calculation type via select', async () => {
    const props = makeProps();
    render(<TestWrapper initialProps={props} />);

    await userEvent.click(screen.getByTestId('visTableAddCalculation'));

    await waitFor(() => {
      const select = screen.getByTestId('visTableFooterCalculation-0') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'max' } });

      expect(props.onStyleChange).toHaveBeenCalledWith({
        footerCalculations: [{ fields: ['price'], calculation: 'max' as CalculationMethod }],
      });
    });
  });

  test('Add a second calculation picks next free calcType and next free field', async () => {
    const props = makeProps();
    render(<TestWrapper initialProps={props} />);

    await userEvent.click(screen.getByTestId('visTableAddCalculation'));
    await userEvent.click(screen.getByTestId('visTableAddCalculation'));

    await waitFor(() => {
      const lastCall = (props.onStyleChange as jest.Mock).mock.calls.pop()?.[0];
      expect(lastCall).toBeTruthy();
      expect(lastCall.footerCalculations).toHaveLength(2);
      expect(lastCall.footerCalculations[1].fields).toEqual(['count']);
      expect(['last', 'mean', 'min', 'max']).toContain(lastCall.footerCalculations[1].calculation);
    });
  });

  test('Calculation options are unique across rows (no duplicated types except current row value)', async () => {
    const props = makeProps();
    render(<TestWrapper initialProps={props} />);

    await userEvent.click(screen.getByTestId('visTableAddCalculation'));
    await userEvent.click(screen.getByTestId('visTableAddCalculation'));

    await waitFor(() => {
      const select0 = screen.getByTestId('visTableFooterCalculation-0');
      const optLastInFirst = within(select0).queryByRole('option', { name: 'Last' });
      expect(optLastInFirst).toBeNull();
    });
  });

  test('Add field via popover + context menu', async () => {
    const props = makeProps({
      styleOptions: makeDefaultStyleOptions({
        footerCalculations: [{ fields: ['price'], calculation: 'total' as CalculationMethod }],
      }),
    });
    render(<TestWrapper initialProps={props} />);

    await waitFor(() => {
      expect(screen.getByTestId('visTableFooterFieldBadge-0-price')).toBeInTheDocument();
      expect(screen.queryByTestId('visTableFooterFieldBadge-0-count')).not.toBeInTheDocument();
      expect(screen.getByTestId('visTableFooterAddField-0')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('visTableFooterAddField-0'));
    const btnCount = await screen.findByText('Count');
    await userEvent.click(btnCount);

    await waitFor(() => {
      expect(props.onStyleChange).toHaveBeenCalledWith({
        footerCalculations: [
          { fields: ['price', 'count'], calculation: 'total' as CalculationMethod },
        ],
      });
    });
  });

  test('Remove field by clicking on field badge', async () => {
    const props = makeProps({
      styleOptions: makeDefaultStyleOptions({
        footerCalculations: [
          { fields: ['price', 'count'], calculation: 'total' as CalculationMethod },
        ],
      }),
    });
    render(<TestWrapper initialProps={props} />);

    const badge = screen.getByTestId('visTableFooterFieldBadge-0-count');
    await userEvent.click(badge);
    expect(props.onStyleChange).toHaveBeenCalledWith({
      footerCalculations: [{ fields: ['price'], calculation: 'total' as CalculationMethod }],
    });
  });

  test('Delete a calculation row', async () => {
    const props = makeProps({
      styleOptions: makeDefaultStyleOptions({
        footerCalculations: [{ fields: ['price'], calculation: 'total' as CalculationMethod }],
      }),
    });
    render(<TestWrapper initialProps={props} />);

    await userEvent.click(screen.getByTestId('visTableFooterDelete-0'));
    expect(props.onStyleChange).toHaveBeenCalledWith({ footerCalculations: [] });
  });

  test('canAddCalculation button disappears when no free field or calcType', async () => {
    const props: TableFooterStyleControlsProps = {
      ...makeProps(),
      numericalColumns: [numericalColumns[0]],
      styleOptions: makeDefaultStyleOptions({
        footerCalculations: [
          { fields: ['price'], calculation: 'total' as CalculationMethod },
          { fields: ['price'], calculation: 'last' as CalculationMethod },
          { fields: ['price'], calculation: 'mean' as CalculationMethod },
          { fields: ['price'], calculation: 'min' as CalculationMethod },
          { fields: ['price'], calculation: 'max' as CalculationMethod },
        ],
      }),
    };
    render(<TestWrapper initialProps={props} />);

    expect(screen.queryByTestId('visTableAddCalculation')).not.toBeInTheDocument();
  });

  test('Sync on numericalColumns change: removes invalid fields & empty calculations', async () => {
    const props = makeProps({
      styleOptions: makeDefaultStyleOptions({
        footerCalculations: [{ fields: ['price'], calculation: 'total' as CalculationMethod }],
      }),
    });

    const { rerender } = render(<TestWrapper initialProps={props} />);

    const nextProps: TableFooterStyleControlsProps = {
      ...props,
      numericalColumns: [numericalColumns[1]],
    };

    rerender(<TestWrapper initialProps={nextProps} />);

    await waitFor(() => {
      expect(props.onStyleChange).toHaveBeenCalledWith({ footerCalculations: [] });
    });
  });
});
