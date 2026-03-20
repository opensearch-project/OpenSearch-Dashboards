/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSmallButtonIcon,
  EuiSmallButtonEmpty,
  EuiToolTip,
  EuiText,
  EuiFieldSearch,
} from '@elastic/eui';
import { getServices, IndexPattern } from '../../../opensearch_dashboards_services';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { buildColumns } from '../../utils/columns';
import { DefaultDiscoverTable } from '../default_discover_table/default_discover_table';
import { DocViewer } from '../doc_viewer/doc_viewer';
import { SortOrder } from '../../../saved_searches/types';
import { DOC_INSPECTOR_PANEL_SETTING, CONTEXT_STEP_SETTING } from '../../../../common';

import './data_grid_table.scss';

const SIDEBAR_MIN_WIDTH = 280;
const SIDEBAR_DEFAULT_WIDTH = 440;

export interface DataGridTableProps {
  columns: string[];
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onMoveColumn: (colName: string, destination: number) => void;
  onRemoveColumn: (column: string) => void;
  hits?: number;
  onSort: (s: SortOrder[]) => void;
  rows: OpenSearchSearchHit[];
  sort: SortOrder[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  showPagination?: boolean;
  scrollToTop?: () => void;
}

export const DataGridTable = ({
  columns,
  indexPattern,
  onAddColumn,
  onFilter,
  onMoveColumn,
  onRemoveColumn,
  onSort,
  sort,
  hits,
  rows,
  title = '',
  description = '',
  isLoading = false,
  showPagination,
  scrollToTop,
}: DataGridTableProps) => {
  const services = getServices();
  const [docInspectorEnabled, stepSize] = useMemo(
    () => [
      services.uiSettings.get(DOC_INSPECTOR_PANEL_SETTING, false),
      services.uiSettings.get(CONTEXT_STEP_SETTING, 5) as number,
    ],
    [services.uiSettings]
  );

  const [inspectedHit, setInspectedHit] = useState<OpenSearchSearchHit | undefined>();
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const [fieldSearchInput, setFieldSearchInput] = useState('');
  const [fieldNameFilter, setFieldNameFilter] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const onFieldSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFieldSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFieldNameFilter(val), 200);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onInspect = useCallback((hit: OpenSearchSearchHit | undefined) => {
    setInspectedHit(hit);
  }, []);

  const closeInspector = useCallback(() => {
    setInspectedHit(undefined);
    setFieldSearchInput('');
    setFieldNameFilter('');
  }, []);

  const inspectedIndex = useMemo(() => {
    if (!inspectedHit) return -1;
    return rows.findIndex((r) => r._id === inspectedHit._id);
  }, [inspectedHit, rows]);

  const navigateDoc = useCallback(
    (delta: number) => {
      const nextIndex = inspectedIndex + delta;
      if (nextIndex >= 0 && nextIndex < rows.length) {
        setInspectedHit(rows[nextIndex]);
      }
    },
    [inspectedIndex, rows]
  );

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const delta = startX - moveEvent.clientX;
        const newWidth = Math.max(SIDEBAR_MIN_WIDTH, startWidth + delta);
        setSidebarWidth(newWidth);
      };

      const onMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [sidebarWidth]
  );

  useEffect(() => {
    return () => {
      isResizing.current = false;
    };
  }, []);

  let adjustedColumns = buildColumns(columns);
  if (
    adjustedColumns.length === 1 &&
    indexPattern &&
    adjustedColumns[0] === indexPattern.timeFieldName
  ) {
    adjustedColumns = [...adjustedColumns, '_source'];
  }

  const tablePanelProps = {
    paddingSize: 'none' as const,
    style: {
      margin: '0px',
    },
    color: 'transparent' as const,
  };

  return (
    <div
      data-render-complete={!isLoading}
      data-shared-item=""
      data-title={title}
      data-description={description}
      data-test-subj="discoverTable"
      className={docInspectorEnabled ? 'dscTable__container' : 'eui-xScrollWithShadows'}
    >
      <div className={docInspectorEnabled ? 'dscTable__tableSection eui-xScrollWithShadows' : ''}>
        <EuiPanel hasBorder={false} hasShadow={false} {...tablePanelProps}>
          <DefaultDiscoverTable
            columns={adjustedColumns}
            indexPattern={indexPattern}
            sort={sort}
            onSort={onSort}
            rows={rows}
            hits={hits}
            onAddColumn={onAddColumn}
            onMoveColumn={onMoveColumn}
            onRemoveColumn={onRemoveColumn}
            onFilter={onFilter}
            showPagination={showPagination}
            scrollToTop={scrollToTop}
            inspectedHit={docInspectorEnabled ? inspectedHit : undefined}
            onInspect={docInspectorEnabled ? onInspect : undefined}
          />
        </EuiPanel>
      </div>

      {docInspectorEnabled && inspectedHit && (
        <>
          {/* Drag handle */}
          <div
            className="dscTable__resizeHandle"
            onMouseDown={onResizeMouseDown}
            data-test-subj="docInspectorResizeHandle"
          />

          <div
            className="dscTable__inspectorPanel"
            style={{ width: sidebarWidth }}
            data-test-subj="docInspectorPanel"
          >
            <div className="dscTable__inspector">
              <EuiFlexGroup
                gutterSize="none"
                alignItems="center"
                responsive={false}
                className="dscTable__inspectorHeader"
              >
                <EuiFlexItem grow={false} className="dscTable__inspectorNav">
                  <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiToolTip content={`Previous ${stepSize}`} position="bottom">
                        <EuiSmallButtonEmpty
                          color="text"
                          onClick={() => navigateDoc(-stepSize)}
                          isDisabled={inspectedIndex < stepSize}
                          aria-label={`Previous ${stepSize} documents`}
                          data-test-subj="docInspectorPrev10"
                          className="dscTable__inspectorNavBtn"
                        >
                          {'«'}
                        </EuiSmallButtonEmpty>
                      </EuiToolTip>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiToolTip content="Previous" position="bottom">
                        <EuiSmallButtonIcon
                          iconType="arrowLeft"
                          color="text"
                          onClick={() => navigateDoc(-1)}
                          isDisabled={inspectedIndex <= 0}
                          aria-label="Previous document"
                          data-test-subj="docInspectorPrev"
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued" className="dscTable__inspectorPos">
                        {inspectedIndex + 1} / {rows.length}
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiToolTip content="Next" position="bottom">
                        <EuiSmallButtonIcon
                          iconType="arrowRight"
                          color="text"
                          onClick={() => navigateDoc(1)}
                          isDisabled={inspectedIndex >= rows.length - 1}
                          aria-label="Next document"
                          data-test-subj="docInspectorNext"
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiToolTip content={`Next ${stepSize}`} position="bottom">
                        <EuiSmallButtonEmpty
                          color="text"
                          onClick={() => navigateDoc(stepSize)}
                          isDisabled={inspectedIndex >= rows.length - stepSize}
                          aria-label={`Next ${stepSize} documents`}
                          data-test-subj="docInspectorNext10"
                          className="dscTable__inspectorNavBtn"
                        >
                          {'»'}
                        </EuiSmallButtonEmpty>
                      </EuiToolTip>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>

                <EuiFlexItem className="dscTable__inspectorSearch">
                  <EuiFieldSearch
                    placeholder="Search fields & values..."
                    value={fieldSearchInput}
                    onChange={onFieldSearchChange}
                    compressed
                    fullWidth
                    aria-label="Filter fields by name"
                    data-test-subj="docInspectorFieldSearch"
                    isClearable
                  />
                </EuiFlexItem>

                <EuiFlexItem grow={false}>
                  <EuiSmallButtonIcon
                    iconType="cross"
                    color="subdued"
                    onClick={closeInspector}
                    aria-label="Close inspector"
                    data-test-subj="docInspectorCloseButton"
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <div className="dscTable__inspectorBody">
                <DocViewer
                  hit={inspectedHit}
                  columns={adjustedColumns}
                  indexPattern={indexPattern}
                  onRemoveColumn={onRemoveColumn}
                  onAddColumn={onAddColumn}
                  filter={(mapping, value, mode) => {
                    onFilter?.(mapping, value, mode);
                  }}
                  fieldNameFilter={fieldNameFilter}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
