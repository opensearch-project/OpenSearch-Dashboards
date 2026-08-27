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

// Dashboard collapsible sections
// "Rendering architecture: nested grids".
//
// This is the shared, reusable `react-grid-layout` primitive used by BOTH
// the outer dashboard grid (DashboardGrid) and each section's inner grid
// (DashboardSectionGrid). It was extracted from DashboardGrid so the exact
// same drag/resize/collision behavior is available at both nesting levels.
//
// Two changes versus the original inline ResponsiveGrid in dashboard_grid.tsx:
//   1. `draggableHandle`/`draggableCancel` are props (not hard-coded), so the
//      outer grid can EXCLUDE inner-grid drags via draggableCancel while the
//      inner grid uses the standard panel dragger -- this is the disjoint-drag
//      isolation the nested-grid prototype proved necessary.
//   2. The "last valid measured width" is a PER-INSTANCE ref, not a module
//      global. The original code kept `lastValidGridSize` as a module-level
//      variable; with nested grids that is actively wrong -- the inner grid's
//      width differs from the outer grid's, and a shared global would let
//      whichever rendered last clobber the other's width. A per-instance ref
//      keeps each grid's width independent.

import 'react-resizable/css/styles.css';

// @ts-ignore
import sizeMe from 'react-sizeme';

import classNames from 'classnames';
import React from 'react';
import ReactGridLayout, { Layout, ReactGridLayoutProps } from 'react-grid-layout';
import { DASHBOARD_GRID_COLUMN_COUNT, DASHBOARD_GRID_HEIGHT } from '../dashboard_constants';

/** Standard panel drag handle class rendered by EmbeddablePanel chrome. */
export const PANEL_DRAG_HANDLE = '.embPanel__dragger';

/**
 * Class applied to a section's inner-grid wrapper. The OUTER grid passes this
 * as `draggableCancel` so a mousedown inside a section's inner grid never
 * starts a drag of the section (outer) item -- the inner member's own grid
 * handles it instead. Disjoint-drag isolation, verified in the prototype.
 */
export const SECTION_INNER_GRID_CANCEL = '.dshDashboardSectionGrid';

/**
 * This is a fix for a bug that stopped the browser window from automatically scrolling down when panels were made
 * taller than the current grid.
 * see https://github.com/elastic/kibana/issues/14710.
 */
function ensureWindowScrollsToBottom(event: { clientY: number; pageY: number }) {
  // The buffer is to handle the case where the browser is maximized and it's impossible for the mouse to move below
  // the screen, out of the window.  see https://github.com/elastic/kibana/issues/14737
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
  /** Extra class(es) on the ReactGridLayout root, e.g. the section inner-grid marker. */
  className?: string;
  /** Defaults to the standard panel dragger. */
  draggableHandle?: string;
  /** In edit mode, mousedowns matching this selector never start a drag on THIS grid. */
  draggableCancel?: string;
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
  draggableCancel,
}: ResponsiveGridProps) {
  // Per-instance "last valid width". sizeMe reports width 0 in some transient
  // states (e.g. while a panel is expanded); we keep the last non-zero width
  // so the grid doesn't collapse to width 0. Instance-local (useRef) so nested
  // grids never clobber each other's width -- see file header note.
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
  // We can't take advantage of isDraggable or isResizable due to performance concerns:
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
      // Pass the named classes of what should get the dragging handle
      // (.doesnt-exist literally doesnt exist -> nothing draggable in view mode)
      draggableHandle={isViewMode ? '.doesnt-exist' : (draggableHandle ?? PANEL_DRAG_HANDLE)}
      draggableCancel={draggableCancel}
      layout={layout}
      onLayoutChange={onLayoutChange}
      onResize={({}, {}, {}, {}, event) => ensureWindowScrollsToBottom(event)}
    >
      {children}
    </ReactGridLayout>
  );
}

// Using sizeMe sets up the grid to be re-rendered automatically not only when the window size changes, but also
// when the container size changes, so it works for Full Screen mode switches.
const config = { monitorWidth: true };
export const ResponsiveSizedGrid = sizeMe(config)(ResponsiveGrid);
