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

import classNames from 'classnames';
import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import { TooltipValueFormatter, TooltipSettings, TooltipValue } from '../../specs';
import { onPointerMove } from '../../state/actions/mouse';
import { GlobalChartState, BackwardRef } from '../../state/chart_state';
import { getChartRotationSelector } from '../../state/selectors/get_chart_rotation';
import { getChartThemeSelector } from '../../state/selectors/get_chart_theme';
import { getInternalIsInitializedSelector, InitStatus } from '../../state/selectors/get_internal_is_intialized';
import { getInternalIsTooltipVisibleSelector } from '../../state/selectors/get_internal_is_tooltip_visible';
import { getInternalTooltipAnchorPositionSelector } from '../../state/selectors/get_internal_tooltip_anchor_position';
import { getInternalTooltipInfoSelector } from '../../state/selectors/get_internal_tooltip_info';
import { getSettingsSpecSelector } from '../../state/selectors/get_settings_specs';
import { getTooltipHeaderFormatterSelector } from '../../state/selectors/get_tooltip_header_formatter';
import { Rotation } from '../../utils/commons';
import { TooltipPortal, PopperSettings, AnchorPosition, Placement } from '../portal';
import { TooltipInfo, TooltipAnchorPosition } from './types';

interface TooltipDispatchProps {
  onPointerMove: typeof onPointerMove;
}

interface TooltipStateProps {
  isVisible: boolean;
  position: TooltipAnchorPosition | null;
  info?: TooltipInfo;
  headerFormatter?: TooltipValueFormatter;
  settings: TooltipSettings;
  rotation: Rotation;
  chartId: string;
  backgroundColor: string;
}

interface TooltipOwnProps {
  getChartContainerRef: BackwardRef;
}

type TooltipProps = TooltipDispatchProps & TooltipStateProps & TooltipOwnProps;

const TooltipComponent = ({
  info,
  headerFormatter,
  position,
  getChartContainerRef,
  settings,
  isVisible,
  rotation,
  chartId,
  onPointerMove,
  backgroundColor,
}: TooltipProps) => {
  const chartRef = getChartContainerRef();

  const handleScroll = () => {
    // TODO: handle scroll cursor update
    onPointerMove({ x: -1, y: -1 }, new Date().getTime());
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderHeader = useCallback(
    (header: TooltipValue | null) => {
      if (!header || !header.isVisible) {
        return null;
      }

      return <div className="echTooltip__header">{headerFormatter ? headerFormatter(header) : header.value}</div>;
    },
    [headerFormatter],
  );

  const renderValues = (values: TooltipValue[]) => (
    <div className="echTooltip__list">
      {values.map(
        ({ seriesIdentifier, valueAccessor, label, value, markValue, color, isHighlighted, isVisible }, index) => {
          if (!isVisible) {
            return null;
          }
          const classes = classNames('echTooltip__item', {
            echTooltip__rowHighlighted: isHighlighted,
          });
          return (
            <div
              // NOTE: temporary to avoid errors
              key={`${seriesIdentifier.key}__${valueAccessor}__${index}`}
              className={classes}
              style={{
                borderLeftColor: color,
              }}
            >
              <div className="echTooltip__item--backgroundColor" style={{ backgroundColor }}>
                <div
                  className="echTooltip__item--color"
                  style={{ backgroundColor: color }}
                />
              </div>

              <div className="echTooltip__item--container">
                <span className="echTooltip__label">{label}</span>
                <span className="echTooltip__value">{value}</span>
                {markValue && (
                  <span className="echTooltip__markValue">
                    &nbsp;(
                    {markValue}
                    )
                  </span>
                )}
              </div>
            </div>
          );
        },
      )}
    </div>
  );

  const renderTooltip = () => {
    if (!info || !isVisible) {
      return null;
    }

    if (typeof settings !== 'string' && settings?.customTooltip) {
      const CustomTooltip = settings.customTooltip;
      return <CustomTooltip {...info} />;
    }

    return (
      <div className="echTooltip">
        {renderHeader(info.header)}
        {renderValues(info.values)}
      </div>
    );
  };

  const anchorPosition = useMemo((): AnchorPosition | null => {
    if (!position || !isVisible) {
      return null;
    }

    const { x0, x1, y0, y1 } = position;
    const width = x0 !== undefined ? x1 - x0 : 0;
    const height = y0 !== undefined ? y1 - y0 : 0;
    return {
      left: x1 - width,
      width,
      top: y1 - height,
      height,
    };
  }, [isVisible, position?.x0, position?.x1, position?.y0, position?.y1]); // eslint-disable-line react-hooks/exhaustive-deps

  const popperSettings = useMemo((): Partial<PopperSettings> | undefined => {
    if (typeof settings === 'string') {
      return;
    }

    const { placement, fallbackPlacements, boundary, ...rest } = settings;

    return {
      ...rest,
      placement: placement ?? (rotation === 0 || rotation === 180 ? Placement.Right : Placement.Top),
      fallbackPlacements:
        fallbackPlacements
        ?? (rotation === 0 || rotation === 180
          ? [Placement.Right, Placement.Left, Placement.Top, Placement.Bottom]
          : [Placement.Top, Placement.Bottom, Placement.Right, Placement.Left]),
      boundary: boundary === 'chart' && chartRef.current ? chartRef.current : undefined,
    };
  }, [settings, chartRef, rotation]);

  return (
    <TooltipPortal
      scope="MainTooltip"
      anchor={{
        position: anchorPosition,
        ref: chartRef.current,
      }}
      settings={popperSettings}
      chartId={chartId}
      visible={isVisible}
    >
      {renderTooltip()}
    </TooltipPortal>
  );
};

TooltipComponent.displayName = 'Tooltip';

const HIDDEN_TOOLTIP_PROPS = {
  isVisible: false,
  info: undefined,
  position: null,
  headerFormatter: undefined,
  settings: {},
  rotation: 0 as Rotation,
  chartId: '',
  backgroundColor: 'transparent',
};

const mapDispatchToProps = (dispatch: Dispatch): TooltipDispatchProps =>
  bindActionCreators({ onPointerMove }, dispatch);

const mapStateToProps = (state: GlobalChartState): TooltipStateProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return HIDDEN_TOOLTIP_PROPS;
  }
  return {
    isVisible: getInternalIsTooltipVisibleSelector(state),
    info: getInternalTooltipInfoSelector(state),
    position: getInternalTooltipAnchorPositionSelector(state),
    headerFormatter: getTooltipHeaderFormatterSelector(state),
    settings: getSettingsSpecSelector(state).tooltip,
    rotation: getChartRotationSelector(state),
    chartId: state.chartId,
    backgroundColor: getChartThemeSelector(state).background.color,
  };
};

/** @internal */
export const Tooltip = memo(connect(mapStateToProps, mapDispatchToProps)(TooltipComponent));
