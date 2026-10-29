/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
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
import { isStringFieldType, isValueCompatibleWithType } from '../lib/type_compatibility';
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

  const getTypes = (field: string) => ({
    predictedType: predictedMapping?.properties?.[field]?.type as string | undefined,
    existingType: existingMapping?.properties?.[field]?.type as string | undefined,
  });

  /**
   * Column-level flag: shown once on the header when the predicted type differs from the existing
   * one. A non-string value going into a string field (e.g. integer -> keyword) is not an error,
   * because the server coerces those values to strings (see server/utils/coerce_to_mapping.ts).
   */
  const renderHeaderFlag = (field: string) => {
    const { predictedType, existingType } = getTypes(field);
    if (!predictedType || !existingType || predictedType === existingType) {
      return null;
    }
    const typeMismatch = i18n.translate('dataImporter.typeMismatchTooltip', {
      defaultMessage: 'Predicted type: {predictedType}, Existing type: {existingType}',
      values: { predictedType, existingType },
    });
    if (isStringFieldType(existingType)) {
      const coerced = i18n.translate('dataImporter.typeCoercedTooltip', {
        defaultMessage: 'Values will be stored as strings.',
      });
      return (
        <EuiToolTip position="top" content={`${typeMismatch}. ${coerced}`}>
          <EuiIcon
            type="iInCircle"
            color="subdued"
            className="previewTable__headerIcon"
            data-test-subj={`dataImporterPreviewHeaderCoerced-${field}`}
          />
        </EuiToolTip>
      );
    }
    return (
      <EuiToolTip position="top" content={typeMismatch}>
        <EuiIcon
          type="alert"
          color="danger"
          className="previewTable__headerIcon"
          data-test-subj={`dataImporterPreviewHeaderMismatch-${field}`}
        />
      </EuiToolTip>
    );
  };

  /**
   * Cell-level flag: only for values that cannot be indexed into the existing field type, so a
   * mixed column highlights just the bad rows.
   */
  const getCellError = (field: string, value: unknown): string | undefined => {
    const { existingType } = getTypes(field);
    if (!existingType || isValueCompatibleWithType(value, existingType)) {
      return undefined;
    }
    return i18n.translate('dataImporter.incompatibleValueTooltip', {
      defaultMessage:
        "''{value}'' is not a valid {existingType} for existing field type {existingType}",
      values: { value: String(value), existingType },
    });
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
      <div className="previewTableContainer">
        <EuiTable className="previewTable">
          <EuiTableHeader>
            <EuiTableHeaderCell>#</EuiTableHeaderCell>
            {previewData?.length > 0 ? (
              Object.keys(previewData[0]).map((key) => (
                <EuiTableHeaderCell key={key}>
                  {key}
                  {renderHeaderFlag(key)}
                </EuiTableHeaderCell>
              ))
            ) : (
              <EuiTableHeaderCell>Column</EuiTableHeaderCell>
            )}
          </EuiTableHeader>
          {/* @ts-expect-error TS2559 TODO(ts-error): fixme */}
          <EuiTableBody>
            {totalRows > 0 &&
              filteredData?.slice(0, loadedRows).map((row, rowIndex) => (
                <EuiTableRow key={rowIndex}>
                  <EuiTableRowCell>{rowIndex + 1}</EuiTableRowCell>
                  {Object.keys(row).map((field, colIndex) => {
                    const cellError = getCellError(field, row[field]);
                    return (
                      <EuiTableRowCell
                        key={colIndex}
                        className={cellError ? 'previewTable__cell--invalid' : undefined}
                        data-test-subj={cellError ? 'dataImporterPreviewCellInvalid' : undefined}
                      >
                        {row[field]}
                        {cellError && (
                          <EuiToolTip position="top" content={cellError}>
                            <EuiIcon
                              type="alert"
                              color="danger"
                              className="previewTable__cellIcon"
                            />
                          </EuiToolTip>
                        )}
                      </EuiTableRowCell>
                    );
                  })}
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
