/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonGroup,
  EuiButtonIcon,
  EuiDataGrid,
  EuiDataGridColumn,
  EuiDataGridSorting,
  EuiDataGridStyle,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiPopover,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useMemo, useState } from 'react';
import './custom_datagrid.scss';

export const MAX_DISPLAY_ROWS = 10000;

type DensityId = 'compact' | 'normal' | 'expanded';

const DENSITY_STYLES: Record<DensityId, Pick<EuiDataGridStyle, 'fontSize' | 'cellPadding'>> = {
  compact: { fontSize: 's', cellPadding: 's' },
  normal: { fontSize: 'm', cellPadding: 'm' },
  expanded: { fontSize: 'l', cellPadding: 'l' },
};

const DENSITY_ICONS: Record<DensityId, string> = {
  compact: 'tableDensityCompact',
  normal: 'tableDensityNormal',
  expanded: 'tableDensityExpanded',
};

// Icon-only density control (replaces EuiDataGrid's built-in text style selector
// so it can sit in a fixed order alongside the other icon toolbar buttons).
const DensityControl: React.FC<{ density: DensityId; onChange: (density: DensityId) => void }> = ({
  density,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const label = i18n.translate('explore.customDataGrid.density', { defaultMessage: 'Density' });
  return (
    <EuiPopover
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition="downCenter"
      panelPaddingSize="s"
      button={
        <EuiToolTip content={label}>
          <EuiButtonIcon
            size="xs"
            color="text"
            display="empty"
            iconType={DENSITY_ICONS[density]}
            aria-label={label}
            data-test-subj="dataGridDensityButton"
            onClick={() => setIsOpen((prev) => !prev)}
          />
        </EuiToolTip>
      }
    >
      <EuiButtonGroup
        legend={label}
        isIconOnly
        buttonSize="compressed"
        idSelected={density}
        onChange={(id) => {
          onChange(id as DensityId);
          setIsOpen(false);
        }}
        options={[
          {
            id: 'compact',
            label: i18n.translate('explore.customDataGrid.densityCompact', {
              defaultMessage: 'Compact',
            }),
            iconType: DENSITY_ICONS.compact,
          },
          {
            id: 'normal',
            label: i18n.translate('explore.customDataGrid.densityNormal', {
              defaultMessage: 'Normal',
            }),
            iconType: DENSITY_ICONS.normal,
          },
          {
            id: 'expanded',
            label: i18n.translate('explore.customDataGrid.densityExpanded', {
              defaultMessage: 'Expanded',
            }),
            iconType: DENSITY_ICONS.expanded,
          },
        ]}
      />
    </EuiPopover>
  );
};

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
  showColumnSelector?: boolean;
  toolbarButtons?: React.ReactNode[];
  secondaryToolbar?: React.ReactNode[];
  fullScreen?: boolean;
  availableWidth?: number;
  defaultHeight?: string;
  visibleColumns?: string[];
  isTableDataLoading?: boolean;
  /** Notified when a user resizes a column, so callers can persist the width. */
  onColumnResize?: (args: { columnId: string; width: number }) => void;
}

export const RenderCustomDataGrid: React.FC<RenderCustomDataGridParams> = ({
  columns,
  renderCellValue,
  rowCount,
  sorting,
  pagination,
  showColumnSelector = true,
  toolbarButtons = [],
  secondaryToolbar = [],
  fullScreen = false,
  availableWidth,
  defaultHeight = '500px',
  visibleColumns,
  isTableDataLoading,
  onColumnResize,
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
  const [density, setDensity] = useState<DensityId>('compact');

  const isEmpty = rowCount === 0;
  const displayedRowCount = Math.min(rowCount, MAX_DISPLAY_ROWS);
  const disableInteractions = useMemo(() => isFullScreen, [isFullScreen]);

  const toolbarControls = useMemo(() => {
    const fullScreenLabel = i18n.translate('explore.toolbarControls.fullScreen', {
      defaultMessage: 'Full screen',
    });

    // Only the "enter full screen" affordance. In full screen the overlay shows
    // its own top-right close (×), so we hide this button to avoid a second ×.
    const fullScreenControl = isFullScreen ? null : (
      <EuiToolTip key="fullScreen" content={fullScreenLabel}>
        <EuiButtonIcon
          size="xs"
          onClick={() => setIsFullScreen(true)}
          color="text"
          display="empty"
          iconType="fullScreen"
          aria-label={fullScreenLabel}
          data-test-subj="fullScreenButton"
        />
      </EuiToolTip>
    );
    const densityControl = <DensityControl key="density" density={density} onChange={setDensity} />;

    // No caller-provided controls (e.g. the flat span-list table): render just
    // the view controls, pushed to the far right of the toolbar (the outer
    // --viewControlsRight class flexes the controls row and margin-autos this).
    if (toolbarButtons.length === 0 && secondaryToolbar.length === 0) {
      return (
        <div className="exploreCustomDataGrid__viewControlsRight">
          {[fullScreenControl, densityControl].filter(Boolean).map((control, i) => (
            <React.Fragment key={i}>{control}</React.Fragment>
          ))}
        </div>
      );
    }

    // Unified single row: the caller's action buttons as a connected cluster on
    // the LEFT, and the view/meta controls (full screen, density, + secondary
    // controls like reset zoom / legend) on the RIGHT. Plain flex (gap, no
    // EuiFlexGroup) so the row hugs the 24px buttons instead of inflating.
    return (
      <div className="exploreCustomDataGrid__toolbarRow">
        {toolbarButtons.length > 0 && (
          <div className="exploreCustomDataGrid__actionCluster">{toolbarButtons}</div>
        )}
        <div className="exploreCustomDataGrid__toolbarRight">
          {[fullScreenControl, densityControl, ...secondaryToolbar]
            .filter(Boolean)
            .map((control, i) => (
              <React.Fragment key={i}>{control}</React.Fragment>
            ))}
        </div>
      </div>
    );
  }, [isFullScreen, density, toolbarButtons, secondaryToolbar]);

  const hasUnifiedToolbar = toolbarButtons.length > 0 || secondaryToolbar.length > 0;

  const gridStyle = useMemo(
    () => ({
      // No per-row horizontal rules — they read as clutter; the waterfall bars +
      // indentation carry structure, and rowHover gives feedback. A single header
      // underline is the one intentional separator.
      border: 'none' as const,
      stripes: false,
      rowHover: 'highlight' as const,
      header: 'underline' as const,
      footer: 'overline' as const,
      ...DENSITY_STYLES[density],
    }),
    [density]
  );

  return (
    <>
      <FullScreenWrapper isFullScreen={isFullScreen} onClose={() => setIsFullScreen(false)}>
        <div
          className={[
            isFullScreen
              ? 'exploreCustomDataGrid__fullWrapper'
              : 'exploreCustomDataGrid__normalWrapper',
            hasUnifiedToolbar ? 'exploreCustomDataGrid--unifiedToolbar' : '',
            !hasUnifiedToolbar ? 'exploreCustomDataGrid--viewControlsRight' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            position: 'relative',
            minHeight: isTableDataLoading && isEmpty ? '100px' : undefined,
          }}
        >
          <div style={{ position: 'relative' }}>
            <EuiDataGrid
              data-test-subj="custom-data-grid"
              aria-labelledby="custom-data-grid"
              columns={columns}
              columnVisibility={{
                visibleColumns: localVisibleColumns,
                setVisibleColumns: setLocalVisibleColumns,
              }}
              rowCount={displayedRowCount}
              // @ts-expect-error TS7006 TODO(ts-error): fixme
              renderCellValue={(props) =>
                renderCellValue({
                  ...props,
                  disableInteractions,
                })
              }
              sorting={sorting}
              toolbarVisibility={{
                showColumnSelector,
                showSortSelector: !!sorting,
                showFullScreenSelector: false,
                // Density is rendered as our own icon control (DensityControl) so
                // it can sit in a fixed order with the other icon buttons.
                showStyleSelector: false,
                additionalControls: toolbarControls,
              }}
              pagination={pagination}
              gridStyle={gridStyle}
              onColumnResize={onColumnResize}
              style={{
                width: isFullScreen ? '100%' : availableWidth ? `${availableWidth}px` : '100%',
                height: isFullScreen ? '100%' : pagination ? 'auto' : defaultHeight,
                maxWidth: isFullScreen ? 'none' : '100%',
                overflow: isFullScreen ? 'visible' : 'hidden',
              }}
            />
          </div>
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
