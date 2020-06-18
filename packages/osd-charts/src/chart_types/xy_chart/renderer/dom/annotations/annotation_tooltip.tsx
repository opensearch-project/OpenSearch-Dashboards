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

import React, { useCallback, useMemo, useEffect } from 'react';

import { TooltipPortal, Placement } from '../../../../../components/portal';
import { AnnotationTooltipState } from '../../../annotations/types';
import { TooltipContent } from './tooltip_content';

interface RectAnnotationTooltipProps {
  state: AnnotationTooltipState | null;
  chartRef: HTMLDivElement | null;
  chartId: string;
  onScroll?: () => void;
}

/** @internal */
export const AnnotationTooltip = ({ state, chartRef, chartId, onScroll }: RectAnnotationTooltipProps) => {
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

  const position = useMemo(() => state?.anchor ?? null, [state?.anchor]);
  const placement = useMemo(() => state?.anchor?.position ?? Placement.Right, [state?.anchor?.position]);
  if (!state?.isVisible) {
    return null;
  }
  return (
    <TooltipPortal
      scope="AnnotationTooltip"
      chartId={chartId}
      anchor={{
        position,
        ref: chartRef,
      }}
      visible={state?.isVisible ?? false}
      settings={{
        placement,
      }}
    >
      {renderTooltip()}
    </TooltipPortal>
  );
};
