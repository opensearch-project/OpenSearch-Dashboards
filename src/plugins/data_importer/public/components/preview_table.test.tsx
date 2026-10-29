/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { PreviewComponent } from './preview_table';

const mixedRows = [
  { name: 'a', criticality: '1' },
  { name: 'b', criticality: '2' },
  { name: 'c', criticality: 'A' },
  { name: 'd', criticality: '4' },
  { name: 'e', criticality: '5' },
];

const renderPreview = (
  previewData: Array<Record<string, any>>,
  predictedMapping: Record<string, any>,
  existingMapping: Record<string, any>
) =>
  render(
    <PreviewComponent
      previewData={previewData}
      visibleRows={10}
      loadMoreRows={jest.fn()}
      predictedMapping={predictedMapping}
      existingMapping={existingMapping}
    />
  );

const invalidCells = (container: HTMLElement) =>
  container.querySelectorAll('[data-test-subj="dataImporterPreviewCellInvalid"]');

describe('PreviewComponent', () => {
  it('renders no flags when there is no existing mapping', () => {
    const { container } = renderPreview(
      mixedRows,
      { properties: { name: { type: 'keyword' }, criticality: { type: 'keyword' } } },
      {}
    );
    expect(invalidCells(container)).toHaveLength(0);
    expect(screen.queryByTestId('dataImporterPreviewHeaderMismatch-criticality')).toBeNull();
    expect(screen.queryByTestId('dataImporterPreviewHeaderCoerced-criticality')).toBeNull();
  });

  it('flags the column header when predicted and existing types differ', () => {
    renderPreview(
      mixedRows,
      { properties: { name: { type: 'keyword' }, criticality: { type: 'keyword' } } },
      { properties: { name: { type: 'keyword' }, criticality: { type: 'integer' } } }
    );
    expect(screen.getByTestId('dataImporterPreviewHeaderMismatch-criticality')).toBeTruthy();
    expect(screen.queryByTestId('dataImporterPreviewHeaderMismatch-name')).toBeNull();
  });

  it('flags only the incompatible cells of a mixed column mapped as integer', () => {
    const { container } = renderPreview(
      mixedRows,
      { properties: { name: { type: 'keyword' }, criticality: { type: 'keyword' } } },
      { properties: { name: { type: 'keyword' }, criticality: { type: 'integer' } } }
    );
    const cells = invalidCells(container);
    expect(cells).toHaveLength(1);
    expect(cells[0].textContent).toContain('A');
    // EuiTableRowCell applies className to its inner content div
    expect(cells[0].querySelector('.previewTable__cell--invalid')).not.toBeNull();
    expect(container.innerHTML).not.toContain('#BD271E');
  });

  it('does not flag numbers going into a keyword field, and marks the header as coerced', () => {
    const { container } = renderPreview(
      [{ code: '1' }, { code: '2' }, { code: '3' }],
      { properties: { code: { type: 'integer' } } },
      { properties: { code: { type: 'keyword' } } }
    );
    expect(invalidCells(container)).toHaveLength(0);
    expect(screen.getByTestId('dataImporterPreviewHeaderCoerced-code')).toBeTruthy();
    expect(screen.queryByTestId('dataImporterPreviewHeaderMismatch-code')).toBeNull();
  });
});
