/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { DocViewTableRow, Props } from './table_row';

let mockFormatJson = true;
jest.mock('../../../data_table/table_cell/json_tree/format_json_setting', () => ({
  useFormatJson: () => mockFormatJson,
}));

describe('DocViewTableRow JSON values', () => {
  const payload = '{"order_id":1002,"error":{"detail":"upstream timeout"}}';
  const props: Props = {
    field: 'payload_raw',
    fieldMapping: { filterable: true } as any,
    fieldType: 'string',
    displayNoMappingWarning: false,
    displayUnderscoreWarning: false,
    isCollapsible: true,
    isColumnActive: false,
    isCollapsed: true,
    onToggleCollapse: jest.fn(),
    onFilter: jest.fn(),
    value: payload,
    valueRaw: payload,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatJson = true;
  });

  it('renders a JSON string value as a tree, without the height-collapse button', () => {
    render(
      <table>
        <tbody>
          <DocViewTableRow {...props} />
        </tbody>
      </table>
    );
    const value = screen.getByTestId('tableDocViewRow-payload_raw-value');
    expect(value.querySelector('[data-test-subj="exploreJsonTree"]')).not.toBeNull();
    expect(value).not.toHaveClass('truncate-by-height');
    expect(screen.queryByTestId('collapseTableRowBtn')).not.toBeInTheDocument();
  });

  it('offers leaf filters through getLeafFilter', () => {
    const apply = jest.fn();
    render(
      <table>
        <tbody>
          <DocViewTableRow
            {...props}
            getLeafFilter={(path, leafValue) =>
              path.join('.') === 'order_id' ? (mode) => apply(leafValue, mode) : undefined
            }
          />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByTestId('jsonTreeFilterFor'));
    expect(apply).toHaveBeenCalledWith(1002, '+');
  });

  it('renders the formatted value when JSON formatting is off or the value is not JSON', () => {
    mockFormatJson = false;
    const { unmount } = render(
      <table>
        <tbody>
          <DocViewTableRow {...props} />
        </tbody>
      </table>
    );
    expect(screen.queryByTestId('exploreJsonTree')).not.toBeInTheDocument();
    unmount();

    mockFormatJson = true;
    render(
      <table>
        <tbody>
          <DocViewTableRow {...props} value="plain" valueRaw="plain" />
        </tbody>
      </table>
    );
    expect(screen.queryByTestId('exploreJsonTree')).not.toBeInTheDocument();
    expect(screen.getByTestId('tableDocViewRow-payload_raw-value')).toHaveTextContent('plain');
  });
});
