/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { EuiResizableContainer } from '@elastic/eui';
import {
  selectIsPromptEditorMode,
  selectLastExecutedTranslatedQuery,
} from '../../../application/utils/state_management/selectors';
import './resizable_query_container.scss';

// Approximate pixel height needed for the query panel to show one line:
// widgets bar (~32px) + editor line (~18px) + editor padding/border (~22px)
const QUERY_PANEL_SINGLE_LINE_PX = 82;
const QUERY_PANEL_MIN_SIZE = '3%';
const QUERY_PANEL_MIN_PCT = 3;
const QUERY_PANEL_MAX_PCT = 72;
const GENERATED_QUERY_SELECTOR = '.exploreQueryPanelGeneratedQuery';
const RESIZABLE_CONTAINER_SELECTOR = '.exploreResizableQueryContainer';

// Compute initial size as a percentage of the viewport so the panel
// always fits at least one editor line regardless of screen height.
export function getInitialQueryPanelSize(): number {
  const layoutEl = document.querySelector('.explore-layout');
  const availableHeight = layoutEl?.clientHeight || window.innerHeight || 800;
  const pct = (QUERY_PANEL_SINGLE_LINE_PX / availableHeight) * 100;
  // Clamp between 5% and 15% to stay reasonable on all screen sizes
  return Math.min(Math.max(pct, 5), 15);
}

interface ResizableQueryContainerProps {
  queryPanel: React.ReactNode;
  children: React.ReactNode;
}

export const ResizableQueryContainer: React.FC<ResizableQueryContainerProps> = ({
  queryPanel,
  children,
}) => {
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const lastExecutedTranslatedQuery = useSelector(selectLastExecutedTranslatedQuery);
  const showGeneratedQuery = isPromptMode && Boolean(lastExecutedTranslatedQuery);

  const innerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const initialSize = useMemo(() => getInitialQueryPanelSize(), []);

  // Panel size = userBase + barPct. Tracking them separately lets the
  // generated-query bar grow and shrink the panel by exactly its height
  // without losing the size the user dragged to.
  const userBaseRef = useRef<number>(initialSize);
  const barPctRef = useRef<number>(0);
  // Updating this re-registers both panels with EUI. The panels stay
  // uncontrolled (no `size` prop) so dragging works natively.
  const [panelInitialSize, setPanelInitialSize] = useState<number>(initialSize);

  const dispatchResize = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }, []);

  // After a drag, remember the user's chosen size minus the bar so the
  // bar's contribution stays purely additive on later transitions.
  const handlePanelWidthChange = useCallback(
    (sizes: { [panelId: string]: number }) => {
      const next = sizes.queryPanel;
      if (typeof next === 'number' && Number.isFinite(next)) {
        const base = Math.min(Math.max(next - barPctRef.current, 0), QUERY_PANEL_MAX_PCT);
        userBaseRef.current = base;
      }
      dispatchResize();
    },
    [dispatchResize]
  );

  // Nudge Monaco to lay out once the container has its real height.
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(timer);
  }, []);

  // Grow the panel to fit the generated-query bar when it appears, and
  // shrink it back by the same amount when it goes away. We use
  // `scrollHeight` so the measurement reflects the bar's natural size
  // even before the panel has grown to accommodate it.
  useEffect(() => {
    if (!showGeneratedQuery || !innerRef.current) {
      if (barPctRef.current > 0) {
        const next = Math.min(
          Math.max(userBaseRef.current, QUERY_PANEL_MIN_PCT),
          QUERY_PANEL_MAX_PCT
        );
        barPctRef.current = 0;
        setPanelInitialSize((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
        dispatchResize();
      }
      return;
    }
    const target = innerRef.current.querySelector<HTMLElement>(GENERATED_QUERY_SELECTOR);
    if (!target) return;
    const containerEl = innerRef.current.closest(
      RESIZABLE_CONTAINER_SELECTOR
    ) as HTMLElement | null;

    const measureAndApply = () => {
      const containerHeight =
        containerEl?.clientHeight ||
        document.querySelector('.explore-layout')?.clientHeight ||
        window.innerHeight ||
        800;
      if (containerHeight < 1) return;
      const naturalPx = Math.max(target.scrollHeight, target.getBoundingClientRect().height);
      const barPct = (naturalPx / containerHeight) * 100;
      if (Math.abs(barPct - barPctRef.current) < 0.05) return;
      barPctRef.current = barPct;
      const next = Math.min(
        Math.max(userBaseRef.current + barPct, QUERY_PANEL_MIN_PCT),
        QUERY_PANEL_MAX_PCT
      );
      setPanelInitialSize((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
      dispatchResize();
    };

    measureAndApply();
    const observer = new ResizeObserver(measureAndApply);
    observer.observe(target);
    if (containerEl) observer.observe(containerEl);
    return () => observer.disconnect();
  }, [showGeneratedQuery, lastExecutedTranslatedQuery, dispatchResize]);

  return (
    <EuiResizableContainer
      direction="vertical"
      className={`exploreResizableQueryContainer${
        isPromptMode ? ' exploreResizableQueryContainer--promptMode' : ''
      }`}
      onPanelWidthChange={handlePanelWidthChange}
    >
      {(EuiResizablePanel, EuiResizableButton) => (
        <>
          <EuiResizablePanel
            id="queryPanel"
            initialSize={panelInitialSize}
            minSize={QUERY_PANEL_MIN_SIZE}
            paddingSize="none"
            className="exploreResizableQueryContainer__queryPanel"
          >
            <div ref={innerRef} className="exploreResizableQueryContainer__queryPanelInner">
              {queryPanel}
            </div>
          </EuiResizablePanel>
          <EuiResizableButton className="exploreResizableQueryContainer__resizeHandle" />
          <EuiResizablePanel
            id="contentPanel"
            initialSize={100 - panelInitialSize}
            minSize="20%"
            paddingSize="none"
            className="exploreResizableQueryContainer__contentPanel"
          >
            {children}
          </EuiResizablePanel>
        </>
      )}
    </EuiResizableContainer>
  );
};
