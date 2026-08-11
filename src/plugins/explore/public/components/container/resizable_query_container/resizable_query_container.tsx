/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { EuiResizableContainer } from '@elastic/eui';
import {
  selectIsPromptEditorMode,
  selectLastExecutedTranslatedQuery,
} from '../../../application/utils/state_management/selectors';
import './resizable_query_container.scss';

// Pixel height needed for the query panel to show one line:
// widgets bar (~30px) + editor line (~18px) + editor padding/border (~22px)
const QUERY_PANEL_SINGLE_LINE_PX = 72;
const QUERY_PANEL_MIN_SIZE = '3%';
const QUERY_PANEL_MIN_PCT = 3;
const QUERY_PANEL_MAX_PCT = 72;
const GENERATED_QUERY_SELECTOR = '.exploreQueryPanelGeneratedQuery';
const BUILDER_SELECTOR = '.plqBuilder';
const RESIZABLE_CONTAINER_SELECTOR = '.exploreResizableQueryContainer';
const QUERY_PANEL_HEIGHT_PROPERTY = '--explore-query-panel-height';

// Initial size as a viewport percentage so the panel fits its target height on
// any screen. `targetPx` is the content height; `maxPct` clamps viewport share.
export function getInitialQueryPanelSize(
  targetPx: number = QUERY_PANEL_SINGLE_LINE_PX,
  maxPct: number = 15
): number {
  const layoutEl = document.querySelector('.explore-layout');
  const availableHeight = layoutEl?.clientHeight || window.innerHeight || 800;
  const pct = (targetPx / availableHeight) * 100;
  return Math.min(Math.max(pct, 5), maxPct);
}

interface ResizableQueryContainerProps {
  queryPanel: React.ReactNode;
  children: React.ReactNode;
  /**
   * True while the logs visual builder is on screen. The panel opens at the
   * builder's measured height as its default; the user can drag it smaller.
   */
  builderActive?: boolean;
}

export const ResizableQueryContainer: React.FC<ResizableQueryContainerProps> = ({
  queryPanel,
  children,
  builderActive = false,
}) => {
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const lastExecutedTranslatedQuery = useSelector(selectLastExecutedTranslatedQuery);
  const showGeneratedQuery = isPromptMode && Boolean(lastExecutedTranslatedQuery);

  const innerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const initialSize = useMemo(() => getInitialQueryPanelSize(), []);

  // The CSS pixel basis is present on the first render. EUI still tracks
  // percentages for dragging, but those percentages never drive the rendered
  // panel height or require the panels to be re-registered after mount.
  const userBasePxRef = useRef<number>(QUERY_PANEL_SINGLE_LINE_PX);
  const barPxRef = useRef<number>(0);
  const userResizedRef = useRef<boolean>(false);
  const containerStyle = useMemo(
    () =>
      ({
        [QUERY_PANEL_HEIGHT_PROPERTY]: `${QUERY_PANEL_SINGLE_LINE_PX}px`,
      }) as React.CSSProperties,
    []
  );

  const dispatchResize = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }, []);

  const applyPanelHeight = useCallback(
    (targetPx: number) => {
      const containerEl = innerRef.current?.closest(
        RESIZABLE_CONTAINER_SELECTOR
      ) as HTMLElement | null;
      if (!containerEl) return;
      const containerHeight =
        containerEl.getBoundingClientRect().height || containerEl.clientHeight;
      const nextPx =
        containerHeight > 0
          ? Math.min(
              Math.max(targetPx, (QUERY_PANEL_MIN_PCT / 100) * containerHeight),
              (QUERY_PANEL_MAX_PCT / 100) * containerHeight
            )
          : targetPx;
      containerEl.style.setProperty(QUERY_PANEL_HEIGHT_PROPERTY, `${nextPx}px`);
      dispatchResize();
    },
    [dispatchResize]
  );

  // EUI reports the requested drag size as a percentage of the full container.
  // Convert that requested size once and store it as the new fixed pixel basis.
  const handlePanelWidthChange = useCallback(
    (sizes: { [panelId: string]: number }) => {
      const next = sizes.queryPanel;
      if (typeof next !== 'number' || !Number.isFinite(next)) return;
      const containerEl = innerRef.current?.closest(
        RESIZABLE_CONTAINER_SELECTOR
      ) as HTMLElement | null;
      const containerHeight =
        containerEl?.getBoundingClientRect().height || containerEl?.clientHeight || 0;
      if (containerHeight < 1) return;
      userResizedRef.current = true;
      userBasePxRef.current = Math.max((next / 100) * containerHeight - barPxRef.current, 0);
      applyPanelHeight(userBasePxRef.current + barPxRef.current);
    },
    [applyPanelHeight]
  );

  // Nudge Monaco to lay out once the container has its real height.
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(timer);
  }, []);

  // Open the panel at the builder's natural height as its default, then keep it
  // matched to the builder's measured height (its rows wrap at narrow widths, so
  // a fixed target would clip them). Once the user drags the resizer, they take
  // over: the panel stays where they put it, including smaller than the builder.
  useLayoutEffect(() => {
    if (!builderActive || !innerRef.current) return;
    userResizedRef.current = false;
    const inner = innerRef.current;
    const builderEl = inner.querySelector<HTMLElement>(BUILDER_SELECTOR);
    if (!builderEl) return;
    // The builder's flex item scrolls, so its overflow is hidden from
    // `inner.scrollHeight` and has to be added back.
    const scrollerEl = builderEl.parentElement;

    const measureAndApply = () => {
      if (!scrollerEl) return;
      // Measure the builder's own content plus the panel chrome around its
      // scroller. `inner.scrollHeight` can't be used: the scroller stretches to
      // whatever height the panel has, so feeding it back in would make the
      // panel grow without bound.
      const innerBox = inner.getBoundingClientRect();
      const scrollerBox = scrollerEl.getBoundingClientRect();
      const chrome = scrollerBox.top - innerBox.top + (innerBox.bottom - scrollerBox.bottom);
      const builderPx = Math.max(builderEl.scrollHeight, builderEl.getBoundingClientRect().height);
      const naturalPx = Math.ceil(chrome + builderPx);
      if (naturalPx < 1 || userResizedRef.current || naturalPx <= userBasePxRef.current) return;
      userBasePxRef.current = naturalPx;
      applyPanelHeight(userBasePxRef.current + barPxRef.current);
    };

    measureAndApply();
    const observer = new ResizeObserver(measureAndApply);
    observer.observe(builderEl);
    return () => observer.disconnect();
  }, [builderActive, applyPanelHeight]);

  // Grow the panel to fit the generated-query bar when it appears, and
  // shrink it back by the same amount when it goes away. We use
  // `scrollHeight` so the measurement reflects the bar's natural size
  // even before the panel has grown to accommodate it.
  useLayoutEffect(() => {
    if (!showGeneratedQuery || !innerRef.current) {
      if (barPxRef.current > 0) {
        barPxRef.current = 0;
        applyPanelHeight(userBasePxRef.current);
      }
      return;
    }
    const target = innerRef.current.querySelector<HTMLElement>(GENERATED_QUERY_SELECTOR);
    if (!target) return;

    const measureAndApply = () => {
      const naturalPx = Math.max(target.scrollHeight, target.getBoundingClientRect().height);
      if (Math.abs(naturalPx - barPxRef.current) < 1) return;
      barPxRef.current = naturalPx;
      applyPanelHeight(userBasePxRef.current + barPxRef.current);
    };

    measureAndApply();
    const observer = new ResizeObserver(measureAndApply);
    observer.observe(target);
    return () => observer.disconnect();
  }, [showGeneratedQuery, lastExecutedTranslatedQuery, applyPanelHeight]);

  return (
    <EuiResizableContainer
      direction="vertical"
      className={`exploreResizableQueryContainer${
        isPromptMode ? ' exploreResizableQueryContainer--promptMode' : ''
      }`}
      onPanelWidthChange={handlePanelWidthChange}
      style={containerStyle}
    >
      {(EuiResizablePanel, EuiResizableButton) => (
        <>
          <EuiResizablePanel
            id="queryPanel"
            initialSize={initialSize}
            minSize={QUERY_PANEL_MIN_SIZE}
            paddingSize="none"
            className="exploreResizableQueryContainer__queryPanel"
            wrapperProps={{ className: 'exploreResizableQueryContainer__queryPanelWrapper' }}
          >
            <div ref={innerRef} className="exploreResizableQueryContainer__queryPanelInner">
              {queryPanel}
            </div>
          </EuiResizablePanel>
          <EuiResizableButton className="exploreResizableQueryContainer__resizeHandle" />
          <EuiResizablePanel
            id="contentPanel"
            initialSize={100 - initialSize}
            minSize="20%"
            paddingSize="none"
            className="exploreResizableQueryContainer__contentPanel"
            wrapperProps={{ className: 'exploreResizableQueryContainer__contentPanelWrapper' }}
          >
            {children}
          </EuiResizablePanel>
        </>
      )}
    </EuiResizableContainer>
  );
};
