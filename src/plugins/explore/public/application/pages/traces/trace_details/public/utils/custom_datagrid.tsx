/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiDataGrid,
  EuiDataGridColumn,
  EuiDataGridSorting,
  EuiLoadingSpinner,
  EuiOverlayMask,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useMemo, useState } from 'react';
import './custom_datagrid.scss';

export const MAX_DISPLAY_ROWS = 10000;

interface FullScreenWrapperProps {
  children: React.ReactNode;
  onClose: () => void;
  isFullScreen: boolean;
}

// EUI Data grid full screen button is currently broken, this is a workaround
const FullScreenWrapper: React.FC<FullScreenWrapperProps> = ({
  children,
  onClose,
  isFullScreen,
}) => {
  if (!isFullScreen) return <>{children}</>;
  return (
    <EuiOverlayMask>
      <div className="exploreCustomDataGrid__fullScreenWrapper">
        <EuiButtonIcon
          iconType="cross"
          aria-label={i18n.translate('explore.customDataGrid.ariaLabel.closeFullScreen', {
            defaultMessage: 'Close full screen',
          })}
          onClick={onClose}
          display="empty"
          className="exploreCustomDataGrid__fullScreenCloseIcon"
        />
        <div className="exploreCustomDataGrid__fullScreenContent">{children}</div>
      </div>
    </EuiOverlayMask>
  );
};

interface PaginationParams {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onChangePage: (page: number) => void;
  onChangeItemsPerPage: (size: number) => void;
}

interface RenderCellValueProps {
  rowIndex: number;
  columnId: string;
  disableInteractions: boolean;
}

interface RenderCustomDataGridParams {
  columns: EuiDataGridColumn[];
  renderCellValue: (props: RenderCellValueProps) => React.ReactNode;
  rowCount: number;
  sorting?: EuiDataGridSorting;
  pagination?: PaginationParams;
  toolbarButtons?: React.ReactNode[];
  fullScreen?: boolean;
  availableWidth?: number;
  defaultHeight?: string;
  visibleColumns?: string[];
  isTableDataLoading?: boolean;
}

export const RenderCustomDataGrid: React.FC<RenderCustomDataGridParams> = ({
  columns,
  renderCellValue,
  rowCount,
  sorting,
  pagination,
  toolbarButtons = [],
  fullScreen = false,
  availableWidth,
  defaultHeight = '500px',
  visibleColumns,
  isTableDataLoading,
}) => {
  const defaultVisibleColumns = useMemo(() => {
    return columns
      .filter((col) => !col.id.includes('attributes') && !col.id.includes('instrumentation'))
      .map((col) => col.id);
  }, [columns]);

  const [localVisibleColumns, setLocalVisibleColumns] = useState(
    visibleColumns ?? defaultVisibleColumns
  );

  const [isFullScreen, setIsFullScreen] = useState(fullScreen);

  const isEmpty = rowCount === 0;
  const displayedRowCount = Math.min(rowCount, MAX_DISPLAY_ROWS);
  const disableInteractions = useMemo(() => isFullScreen, [isFullScreen]);

  const toolbarControls = useMemo(() => {
    const controls = [];

    controls.push(
      <EuiButtonEmpty
        size="xs"
        onClick={() => setIsFullScreen((prev) => !prev)}
        key="fullScreen"
        color="text"
        iconType={isFullScreen ? 'cross' : 'fullScreen'}
        data-test-subj="fullScreenButton"
      >
        {isFullScreen
          ? i18n.translate('explore.toolbarControls.exitFullScreen', {
              defaultMessage: 'Exit full screen',
            })
          : i18n.translate('explore.toolbarControls.fullScreen', {
              defaultMessage: 'Full screen',
            })}
      </EuiButtonEmpty>
    );

    controls.push(...toolbarButtons);

    return controls;
  }, [isFullScreen, toolbarButtons]);

  const gridStyle = useMemo(
    () => ({
      border: 'horizontal' as const,
      stripes: false,
      rowHover: 'highlight' as const,
      header: 'underline' as const,
      fontSize: 's' as const,
      cellPadding: 's' as const,
      footer: 'overline' as const,
    }),
    []
  );

  return (
    <>
      <FullScreenWrapper isFullScreen={isFullScreen} onClose={() => setIsFullScreen(false)}>
        <div
          className={[
            isFullScreen
              ? 'exploreCustomDataGrid__fullWrapper'
              : 'exploreCustomDataGrid__normalWrapper',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            position: 'relative',
            minHeight: isTableDataLoading && isEmpty ? '100px' : undefined,
          }}
        >
          <EuiDataGrid
            data-test-subj="custom-data-grid"
            aria-labelledby="custom-data-grid"
            columns={columns}
            columnVisibility={{
              visibleColumns: localVisibleColumns,
              setVisibleColumns: setLocalVisibleColumns,
            }}
            rowCount={displayedRowCount}
            renderCellValue={(props) =>
              renderCellValue({
                ...props,
                disableInteractions,
              })
            }
            sorting={sorting}
            toolbarVisibility={{
              showColumnSelector: true,
              showSortSelector: !!sorting,
              showFullScreenSelector: false,
              additionalControls: toolbarControls,
            }}
            pagination={pagination}
            gridStyle={gridStyle}
            style={{
              width: isFullScreen ? '100%' : availableWidth ? `${availableWidth}px` : '100%',
              height: isFullScreen ? '100%' : pagination ? 'auto' : defaultHeight,
              maxWidth: isFullScreen ? 'none' : '100%',
              overflow: isFullScreen ? 'visible' : 'hidden',
            }}
          />
          {isTableDataLoading && (
            <div className="exploreCustomDataGrid__gridLoadingOverlay">
              <EuiLoadingSpinner data-test-subj="loadingSpinner" size="xl" />
            </div>
          )}
        </div>
      </FullScreenWrapper>
    </>
  );
};
