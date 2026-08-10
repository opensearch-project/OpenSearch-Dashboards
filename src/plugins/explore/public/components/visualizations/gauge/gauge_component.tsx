/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { EChartsOption } from 'echarts';
import { EchartsRender } from '../echarts_render';
import { appendUnitSuffix } from '../style_panel/unit/collection';
import { GaugeTextRenderData } from './gauge_chart_utils';

import './gauge_component.scss';

interface GaugeChartRenderProps {
  spec: EChartsOption;
  text?: GaugeTextRenderData;
  seriesName?: string;
}

const constrainFontSizeByWidth = ({
  containerWidth,
  text,
  fontSize,
  minSize,
  maxSize,
  paddingRatio = 0.2,
  charWidthRatio = 0.6,
}: {
  containerWidth: number;
  text: string;
  fontSize: number;
  minSize: number;
  maxSize: number;
  paddingRatio?: number;
  charWidthRatio?: number;
}) => {
  if (!text || containerWidth <= 0) {
    return Math.max(minSize, Math.min(maxSize, fontSize));
  }

  const availableWidth = containerWidth * (1 - paddingRatio);
  const maxSizeByWidth = availableWidth / (text.length * charWidthRatio);
  return Math.max(minSize, Math.min(maxSize, fontSize, maxSizeByWidth));
};

export const GaugeChartRender: React.FC<GaugeChartRenderProps> = ({ spec, text, seriesName }) => {
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef(
    debounce((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerDimensions({ width, height });
      }
    }, 100)
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handler = handlerRef.current;
    const resizeObserver = new ResizeObserver(handler);
    resizeObserver.observe(element);

    return () => {
      handler.cancel();
      resizeObserver.disconnect();
    };
  }, []);

  const title = (() => {
    if (!text?.title) {
      return undefined;
    }
    if (seriesName) {
      return text.title.customTitle ? `${seriesName} ${text.title.customTitle}` : seriesName;
    }
    return text.title.customTitle ?? text.title.valueFieldName;
  })();

  const valueWithUnit =
    text && text.unitFirst
      ? `${text.unit ?? ''}${text.value}`
      : `${text?.value ?? ''}${text?.unit ?? ''}`;
  const fullValueText = appendUnitSuffix(valueWithUnit, text?.unitSuffix);

  const fontSizes = useMemo(() => {
    if (!text) {
      return { value: 40, title: 12, unit: 18 };
    }

    const { width, height } = containerDimensions;
    const measuredSize = width > 0 && height > 0 ? Math.min(width, height) : 400;
    const valueSize = constrainFontSizeByWidth({
      containerWidth: width || measuredSize,
      text: fullValueText,
      fontSize: measuredSize * 0.15,
      minSize: 16,
      maxSize: 72,
    });
    const titleSize = constrainFontSizeByWidth({
      containerWidth: width || measuredSize,
      text: title ?? '',
      fontSize: measuredSize * 0.05,
      minSize: 14,
      maxSize: 36,
    });
    const unitSize = text.unitFirst ? valueSize * 0.85 : valueSize * 0.45;

    return {
      value: valueSize,
      title: titleSize,
      unit: unitSize,
    };
  }, [containerDimensions, fullValueText, text, title]);

  return (
    <div className="gauge-component" ref={containerRef}>
      {text && (
        <div className="gauge-text-overlay">
          <div className="gauge-text-content">
            <div className="gauge-value" title={fullValueText}>
              {text.unitFirst && text.unit && (
                <span
                  className="gauge-value-unit"
                  style={{ color: text.unitColor, fontSize: fontSizes.unit }}
                >
                  {text.unit}
                </span>
              )}
              <span
                className="gauge-value-number"
                style={{ color: text.valueColor, fontSize: fontSizes.value }}
              >
                {text.value}
              </span>
              {!text.unitFirst && text.unit && (
                <span
                  className="gauge-value-unit gauge-value-unit--suffix"
                  style={{ color: text.unitColor, fontSize: fontSizes.unit }}
                >
                  {text.unit}
                </span>
              )}
              {text.unitSuffix && (
                <span
                  className="gauge-value-unit gauge-value-custom-suffix"
                  style={{
                    color: text.unitColor,
                    fontSize: fontSizes.unit,
                    marginLeft: text.unitSuffix.startsWith('/') ? 0 : '0.2em',
                  }}
                >
                  {text.unitSuffix}
                </span>
              )}
            </div>
            {title && (
              <div
                className="gauge-title"
                title={title}
                style={{ color: text.titleColor, fontSize: fontSizes.title }}
              >
                {title}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="gauge-chart">
        <EchartsRender spec={spec} />
      </div>
    </div>
  );
};
