import React, { useState } from 'react';
import {
  EuiText,
  EuiTable,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableBody,
  EuiTableRow,
  EuiTableRowCell,
  EuiButton,
  EuiFieldSearch,
} from '@elastic/eui';
import './preview_component.scss';

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
  const [searchQuery, setSearchQuery] = useState('');
  const totalRows = previewData.length;
  const loadedRows = Math.min(visibleRows, totalRows);

  const filteredData = previewData.filter((row) =>
    Object.values(row).some(
      (value) =>
        typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <EuiText>
          <h3>
            Preview Data ({loadedRows}/{totalRows})
          </h3>
        </EuiText>
        {totalRows > 0 && (
          <EuiFieldSearch
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            isClearable
            className="customSearchBar"
          />
        )}
      </div>
      {totalRows > 0 ? (
        <div style={{ height: 'calc(100% - 40px)', overflowY: 'auto' }}>
          <EuiTable>
            <EuiTableHeader>
              <EuiTableHeaderCell>#</EuiTableHeaderCell>
              {Object.keys(previewData[0]).map((key) => (
                <EuiTableHeaderCell key={key}>{key}</EuiTableHeaderCell>
              ))}
            </EuiTableHeader>
            <EuiTableBody>
              {filteredData.slice(0, loadedRows).map((row, rowIndex) => (
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
      {loadedRows < totalRows && (
        <EuiButton onClick={loadMoreRows} style={{ marginTop: '20px' }}>
          Click to See More
        </EuiButton>
      )}
    </>
  );
};
