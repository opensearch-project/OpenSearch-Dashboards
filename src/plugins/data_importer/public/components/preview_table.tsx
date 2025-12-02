/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
  EuiIcon,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import './preview_table.scss';

interface PreviewComponentProps {
  previewData: Array<Record<string, any>>;
  visibleRows: number;
  loadMoreRows: () => void;
  predictedMapping: Record<string, any>;
  existingMapping: Record<string, any>;
}

export const PreviewComponent = ({
  previewData,
  visibleRows,
  loadMoreRows,
  predictedMapping,
  existingMapping,
}: PreviewComponentProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const totalRows = previewData?.length;
  const loadedRows = Math.min(visibleRows, totalRows);

  const filteredData = previewData?.filter((row) =>
    Object.values(row).some(
      (value) =>
        typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getCellStyle = (field: string) => {
    const predictedType = predictedMapping?.properties?.[field]?.type;
    const existingType = existingMapping?.properties?.[field]?.type;
    if (predictedType && existingType && predictedType !== existingType) {
      return { color: '#BD271E' };
    }
    return {};
  };

  const getTooltipContent = (field: string) => {
    const predictedType = predictedMapping?.properties?.[field]?.type;
    const existingType = existingMapping?.properties?.[field]?.type;
    if (predictedType && existingType && predictedType !== existingType) {
      return i18n.translate('dataImporter.typeMismatchTooltip', {
        defaultMessage: 'Predicted type: {predictedType}, Existing type: {existingType}',
        values: { predictedType, existingType },
      });
    }
    return '';
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <EuiText>
          <h3>
            {i18n.translate('dataImporter.previewData', {
              defaultMessage: `Preview data`,
            })}
            ({loadedRows}/{totalRows})
          </h3>
        </EuiText>
        <EuiFieldSearch
          placeholder={i18n.translate('dataImporter.searchPlaceholder', {
            defaultMessage: 'Search...',
          })}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          isClearable
          className="customSearchBar"
        />
      </div>
      <div style={{ height: 'calc(100% - 40px)', overflowY: 'auto' }}>
        <EuiTable>
          <EuiTableHeader>
            <EuiTableHeaderCell>#</EuiTableHeaderCell>
            {previewData?.length > 0 ? (
              Object.keys(previewData[0]).map((key) => (
                <EuiTableHeaderCell key={key}>{key}</EuiTableHeaderCell>
              ))
            ) : (
              <EuiTableHeaderCell>Column</EuiTableHeaderCell>
            )}
          </EuiTableHeader>
          <EuiTableBody>
            {totalRows > 0 &&
              filteredData?.slice(0, loadedRows).map((row, rowIndex) => (
                <EuiTableRow key={rowIndex}>
                  <EuiTableRowCell>{rowIndex + 1}</EuiTableRowCell>
                  {Object.keys(row).map((field, colIndex) => (
                    <EuiTableRowCell key={colIndex} style={getCellStyle(field)}>
                      {row[field]}
                      {getTooltipContent(field) && (
                        <EuiToolTip position="top" content={getTooltipContent(field)}>
                          <EuiIcon type="alert" color="danger" style={{ marginLeft: '5px' }} />
                        </EuiToolTip>
                      )}
                    </EuiTableRowCell>
                  ))}
                </EuiTableRow>
              ))}
          </EuiTableBody>
        </EuiTable>

        {totalRows === 0 && (
          <EuiText textAlign="center" style={{ marginTop: '20px' }}>
            <p>
              {i18n.translate('dataImporter.noData', {
                defaultMessage: `No data to display. Please upload a file to see the preview.`,
              })}
            </p>
          </EuiText>
        )}
      </div>
      {loadedRows < totalRows && (
        <EuiButton onClick={loadMoreRows} style={{ marginTop: '20px' }}>
          {i18n.translate('dataImporter.seeMore', {
            defaultMessage: `Click to See More`,
          })}
        </EuiButton>
      )}
    </>
  );
};
