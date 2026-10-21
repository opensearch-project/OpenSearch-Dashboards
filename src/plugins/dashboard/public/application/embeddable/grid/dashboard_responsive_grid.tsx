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

import 'react-resizable/css/styles.css';

// @ts-ignore
import sizeMe from 'react-sizeme';

import classNames from 'classnames';
import React from 'react';
import ReactGridLayout, { Layout, ReactGridLayoutProps } from 'react-grid-layout';
import { DASHBOARD_GRID_COLUMN_COUNT, DASHBOARD_GRID_HEIGHT } from '../dashboard_constants';

export const PANEL_DRAG_HANDLE = '.embPanel__dragger';

// Keep the page scrolling when a resize reaches the viewport edge.
function ensureWindowScrollsToBottom(event: { clientY: number; pageY: number }) {
  // The pointer cannot move below a maximized browser window.
  const WINDOW_BUFFER = 10;
  if (event.clientY > window.innerHeight - WINDOW_BUFFER) {
    window.scrollTo(0, event.pageY + WINDOW_BUFFER - window.innerHeight);
  }
}

export interface ResponsiveGridProps {
  size: { width: number };
  isViewMode: boolean;
  layout: Layout[];
  onLayoutChange: ReactGridLayoutProps['onLayoutChange'];
  children: JSX.Element[];
  maximizedPanelId?: string;
  useMargins: boolean;
  className?: string;
  draggableHandle?: string;
}

function ResponsiveGrid({
  size,
  isViewMode,
  layout,
  onLayoutChange,
  children,
  maximizedPanelId,
  useMargins,
  className,
  draggableHandle,
}: ResponsiveGridProps) {
  // sizeMe can report zero while layouts change; retain the last usable width
  // independently for each nested grid.
  const lastValidWidthRef = React.useRef(0);
  if (size.width > 0) {
    lastValidWidthRef.current = size.width;
  }
  const width = lastValidWidthRef.current;

  const classes = classNames(className, {
    'dshLayout--viewing': isViewMode,
    'dshLayout--editing': !isViewMode,
    'dshLayout-isMaximizedPanel': maximizedPanelId !== undefined,
    'dshLayout-withoutMargins': !useMargins,
  });

  const MARGINS = useMargins ? 8 : 0;
  // Toggling isDraggable or isResizable has known performance costs:
  // https://github.com/STRML/react-grid-layout/issues/240
  return (
    // @ts-expect-error TS2769 TODO(ts-error): fixme
    <ReactGridLayout
      width={width}
      className={classes}
      isDraggable={true}
      isResizable={true}
      // There is a bug with d3 + firefox + elements using transforms.
      // See https://github.com/elastic/kibana/issues/16870 for more context.
      useCSSTransforms={false}
      margin={[MARGINS, MARGINS]}
      cols={DASHBOARD_GRID_COLUMN_COUNT}
      rowHeight={DASHBOARD_GRID_HEIGHT}
      // A selector that matches nothing disables dragging without the
      // performance cost of toggling isDraggable.
      draggableHandle={
        isViewMode || maximizedPanelId !== undefined
          ? '.doesnt-exist'
          : (draggableHandle ?? PANEL_DRAG_HANDLE)
      }
      layout={layout}
      onLayoutChange={onLayoutChange}
      onResize={({}, {}, {}, {}, event) => ensureWindowScrollsToBottom(event)}
    >
      {children}
    </ReactGridLayout>
  );
}

// Observe container width so nested and full-screen grids resize correctly.
const config = { monitorWidth: true };
export const ResponsiveSizedGrid = sizeMe(config)(ResponsiveGrid);
