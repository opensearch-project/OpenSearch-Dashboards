import React from 'react';
import {
  EuiText,
  EuiTable,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableBody,
  EuiTableRow,
  EuiTableRowCell,
  EuiButton,
} from '@elastic/eui';

interface PreviewComponentProps {
  previewData: any[];
  visibleRows: number;
  loadMoreRows: () => void;
}

export const PreviewComponent = ({
  previewData,
  visibleRows,
  loadMoreRows,
}: PreviewComponentProps) => {
  return (
    <>
      <EuiText>
        <h3>Preview Data</h3>
      </EuiText>
      {previewData.length > 0 ? (
        <div style={{ height: 'calc(100% - 40px)', overflowY: 'auto' }}>
          <EuiTable>
            <EuiTableHeader>
              <EuiTableHeaderCell>#</EuiTableHeaderCell>
              {Object.keys(previewData[0]).map((key) => (
                <EuiTableHeaderCell key={key}>{key}</EuiTableHeaderCell>
              ))}
            </EuiTableHeader>
            <EuiTableBody>
              {previewData.slice(0, visibleRows).map((row, rowIndex) => (
                <EuiTableRow key={rowIndex}>
                  <EuiTableRowCell>{rowIndex + 1}</EuiTableRowCell>
                  {Object.keys(row).map((field, colIndex) => (
                    <EuiTableRowCell key={colIndex}>{row[field]}</EuiTableRowCell>
                  ))}
                </EuiTableRow>
              ))}
            </EuiTableBody>
          </EuiTable>
        </div>
      ) : (
        <EuiText>
          <p>No data to display. Please upload a file to see the preview.</p>
        </EuiText>
      )}
      {visibleRows < previewData.length && (
        <EuiButton onClick={loadMoreRows} style={{ marginTop: '20px' }}>
          Click to See More
        </EuiButton>
      )}
    </>
  );
};
