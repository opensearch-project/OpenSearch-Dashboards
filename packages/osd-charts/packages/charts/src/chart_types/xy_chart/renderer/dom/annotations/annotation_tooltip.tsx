/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useCallback, useMemo, useEffect, RefObject } from 'react';

import { TooltipPortal, Placement, TooltipPortalSettings } from '../../../../../components/portal';
import { AnnotationTooltipState } from '../../../annotations/types';
import { TooltipContent } from './tooltip_content';

interface AnnotationTooltipProps {
  state: AnnotationTooltipState | null;
  chartRef: RefObject<HTMLDivElement>;
  chartId: string;
  zIndex: number;
  onScroll?: () => void;
}

/** @internal */
export const AnnotationTooltip = ({ state, chartRef, chartId, onScroll, zIndex }: AnnotationTooltipProps) => {
  const renderTooltip = useCallback(() => {
    if (!state || !state.isVisible) {
      return null;
    }

    return <TooltipContent {...state} />;
  }, [state]);

  const handleScroll = () => {
    // TODO: handle scroll cursor update
    if (onScroll) {
      onScroll();
    }
  };

  useEffect(() => {
    if (onScroll) {
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const popperSettings = useMemo((): TooltipPortalSettings | undefined => {
    const settings = state?.tooltipSettings;
    if (!settings) {
      return;
    }

    const { placement, boundary, ...rest } = settings;

    return {
      ...rest,
      placement: placement ?? Placement.Right,
      boundary: boundary === 'chart' ? chartRef.current ?? undefined : boundary,
    };
  }, [state?.tooltipSettings, chartRef]);

  const position = useMemo(() => state?.anchor ?? null, [state?.anchor]);
  if (!state?.isVisible) {
    return null;
  }
  return (
    <TooltipPortal
      scope="AnnotationTooltip"
      chartId={chartId}
      // increasing by 100 the tooltip portal zIndex to avoid conflicts with highlighters and other elements in the DOM
      zIndex={zIndex + 100}
      anchor={{
        position,
        ref: chartRef.current,
      }}
      visible={state?.isVisible ?? false}
      settings={popperSettings}
    >
      {renderTooltip()}
    </TooltipPortal>
  );
};
