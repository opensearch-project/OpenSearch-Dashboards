/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { EuiButtonIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import dompurify from 'dompurify';
import React, { useMemo, useState } from 'react';
import { escape } from 'lodash';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import { TableCell } from '../table_cell/table_cell';
import { EmptyTableCell } from '../table_cell/empty_table_cell';
import { SourceFieldTableCell } from '../table_cell/source_field_table_cell';
import { NonFilterableTableCell } from '../table_cell/non_filterable_table_cell';
import { useFormatJson } from '../table_cell/json_tree/format_json_setting';
import { JsonContainer, hasOwnFieldFormat, tryParseJson } from '../table_cell/json_tree/json_utils';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../../types/doc_views_types';
import { isSourceColumn } from '../../../helpers/is_source_column';
import { formatListTime } from '../list_time_format';
import { normalizeSeverityText, SEVERITY_TEXT_FIELDS } from '../../../helpers/severity_text';

const DATE_FORMATTER_IDS = new Set(['date', 'date_nanos']);

/** Whether the field's effective formatter is still a date / date_nanos one. */
const usesDateFormatter = (dataset: IndexPattern | Dataset, fieldInfo: FieldInfo): boolean => {
  if (!fieldInfo || typeof dataset.getFormatterForField !== 'function') return false;
  const formatterId = (dataset.getFormatterForField(fieldInfo)?.type as { id?: string } | undefined)
    ?.id;
  return formatterId ? DATE_FORMATTER_IDS.has(formatterId) : false;
};

type FieldInfo = ReturnType<(IndexPattern | Dataset)['fields']['getByName']>;

/**
 * Whether a column is rendered by `NonFilterableTableCell` (plain text, no tree). On the Traces
 * page every cell goes through `TableCell`, see the comment in the row below.
 */
const isNonFilterableCell = (fieldInfo: FieldInfo, isOnTracesPage: boolean) =>
  fieldInfo?.filterable === false && !isOnTracesPage;

const NO_JSON_VALUES: ReadonlyMap<string, JsonContainer> = new Map();

/**
 * The parsed value of each cell of a row that is shown as a JSON tree: a string holding a JSON
 * object or array, in a column rendered by `TableCell` (not the time field, the `_source` column
 * or a non-filterable field), whose field has no format of its own in the index pattern.
 */
const getJsonTreeValues = (
  dataset: IndexPattern | Dataset,
  columns: string[],
  flattened: Record<string, unknown>,
  isOnTracesPage: boolean
): ReadonlyMap<string, JsonContainer> => {
  const values = new Map<string, JsonContainer>();
  for (const colName of columns) {
    const value = flattened[colName];
    if (typeof value !== 'string' || colName === dataset.timeFieldName) continue;
    if (hasOwnFieldFormat(dataset, colName)) continue;
    const fieldInfo = dataset.fields.getByName(colName);
    if (isSourceColumn(colName, fieldInfo) || isNonFilterableCell(fieldInfo, isOnTracesPage)) {
      continue;
    }
    const parsed = tryParseJson(value);
    if (parsed) values.set(colName, parsed);
  }
  return values;
};

export interface TableRowContentProps {
  row: OpenSearchSearchHit<Record<string, unknown>>;
  index?: number;
  columns: string[];
  dataset: IndexPattern | Dataset;
  onFilter?: DocViewFilterFn;
  isShortDots: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isOnTracesPage: boolean;
  wrapCellText?: boolean;
  /**
   * Pattern for the time field in the list (seconds, no fractional part).
   * Without it, or when the time field has its own field format, the field's
   * formatted value is shown.
   */
  timeColumnPattern?: string;
}

// Helper functions
const getCellClassName = (
  timeFieldName?: string,
  colName?: string,
  wrapCellText?: boolean
): string => {
  const baseClass = 'exploreDocTableCell';
  if (timeFieldName === colName) {
    return `${baseClass} eui-textNoWrap`;
  }
  return wrapCellText ? baseClass : `${baseClass} eui-textTruncate`;
};

const shouldShowEmptyCell = (row: any, formattedValue: any): boolean => {
  return typeof row === 'undefined' || typeof formattedValue === 'undefined';
};

const formatFieldValue = (
  dataset: IndexPattern | Dataset,
  row: OpenSearchSearchHit<Record<string, unknown>>,
  colName: string
): string => {
  return dataset.formatField(row, colName);
};

export const TableRowContent: React.FC<TableRowContentProps> = ({
  row,
  index,
  columns,
  dataset,
  onFilter,
  isShortDots,
  isExpanded,
  onToggleExpand,
  isOnTracesPage,
  wrapCellText,
  timeColumnPattern,
}) => {
  const [isRowSelected, setIsRowSelected] = useState(false);

  const flattened = dataset.flattenHit(row);
  // The cells shown as a JSON tree, parsed once here and passed down. Users can turn the trees
  // off in the table settings. A row showing a tree is several lines tall, so its time cell can
  // put the date and the time on separate lines at no cost in height.
  const formatJson = useFormatJson();
  const jsonValues = useMemo(
    () =>
      formatJson ? getJsonTreeValues(dataset, columns, flattened, isOnTracesPage) : NO_JSON_VALUES,
    [formatJson, dataset, columns, flattened, isOnTracesPage]
  );
  const hasJsonTree = jsonValues.size > 0;
  return (
    <tr
      key={row._id}
      className={row.isAnchor || isRowSelected ? 'exploreDocTable__row--highlight' : ''}
    >
      {isOnTracesPage ? (
        <td />
      ) : (
        <td
          data-test-subj="docTableExpandToggleColumn"
          className="exploreDocTableCell__toggleDetails"
        >
          <EuiButtonIcon
            color="text"
            onClick={onToggleExpand}
            iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
            aria-label={i18n.translate('explore.defaultTable.docTableExpandToggleColumnLabel', {
              defaultMessage: `Toggle row details`,
            })}
            size="xs"
            data-test-subj="docTableExpandToggleColumn"
          />
        </td>
      )}
      {columns.map((colName) => {
        const fieldInfo = dataset.fields.getByName(colName);
        const fieldMapping = flattened[colName];
        const isTimeField = dataset.timeFieldName === colName;
        // Suppress value filtering on the configured time field (regardless of its
        // mapped type) and on any date-typed column: PPL exact-equality on a
        // timestamp is broken (timezone-shifted display vs. raw value, and it
        // effectively never matches). Time filtering is owned by the time picker.
        const isDateField = fieldInfo?.type === 'date' || fieldInfo?.type === 'date_nanos';
        const disableValueFilter = isTimeField || isDateField || fieldInfo?.filterable === false;

        if (shouldShowEmptyCell(row, null)) {
          return <EmptyTableCell key={colName} colName={colName} wrapCellText={wrapCellText} />;
        }

        if (isSourceColumn(colName, fieldInfo)) {
          return (
            <SourceFieldTableCell
              key={colName}
              colName={colName}
              dataset={dataset}
              row={row}
              isShortDots={isShortDots}
              wrapCellText={wrapCellText}
            />
          );
        }

        // Display-only overrides apply only where the field uses its default
        // formatter: a per-field format in the index pattern always wins. For the
        // time field, so does an admin's `format:defaultTypeMap` choice: the list
        // pattern is used only while the field still formats as date/date_nanos.
        const hasFieldFormat = Boolean(dataset.fieldFormatMap?.[colName]);
        const listTime =
          isTimeField &&
          timeColumnPattern &&
          !hasFieldFormat &&
          usesDateFormatter(dataset, fieldInfo)
            ? formatListTime(fieldMapping, timeColumnPattern)
            : undefined;
        const severityLabel =
          SEVERITY_TEXT_FIELDS.has(colName) && !hasFieldFormat
            ? normalizeSeverityText(fieldMapping)
            : undefined;
        const formattedValue =
          listTime ??
          (severityLabel ? escape(severityLabel) : formatFieldValue(dataset, row, colName));

        if (shouldShowEmptyCell(row, formattedValue)) {
          return <EmptyTableCell key={colName} colName={colName} wrapCellText={wrapCellText} />;
        }

        const sanitizedCellValue = dompurify.sanitize(formattedValue);

        // On the Traces page every query is PPL (list, charts, trace-details), so
        // the DSL-path enforcement of searchable/aggregatable never applies here.
        // Route all cells through TableCell — it decides link-vs-plain per column
        // and suppresses value-filter buttons via disableValueFilter — rather than
        // the no-link NonFilterableTableCell, so a trace-link column can never be
        // silently stripped of its link when its field resolves non-filterable.
        if (isNonFilterableCell(fieldInfo, isOnTracesPage)) {
          return (
            <NonFilterableTableCell
              key={colName}
              colName={colName}
              className={getCellClassName(dataset.timeFieldName, colName, wrapCellText)}
              sanitizedCellValue={sanitizedCellValue}
              isTimeField={isTimeField}
              index={index}
              rowData={row}
              columnId={colName}
            />
          );
        }

        return (
          <TableCell
            key={colName}
            columnId={colName}
            index={index}
            onFilter={onFilter}
            isTimeField={isTimeField}
            disableValueFilter={disableValueFilter}
            fieldMapping={fieldMapping}
            sanitizedCellValue={sanitizedCellValue}
            rowData={row}
            dataset={dataset}
            isOnTracesPage={isOnTracesPage}
            setIsRowSelected={setIsRowSelected}
            wrapCellText={wrapCellText}
            splitDateTime={isTimeField && hasJsonTree}
            listTimePattern={listTime ? timeColumnPattern : undefined}
            fitContent={SEVERITY_TEXT_FIELDS.has(colName)}
            jsonValue={jsonValues.get(colName)}
          />
        );
      })}
    </tr>
  );
};
