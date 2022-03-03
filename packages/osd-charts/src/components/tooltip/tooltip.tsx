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

import chroma from 'chroma-js';
import classNames from 'classnames';
import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import { isColorValid } from '../../common/color_calcs';
import { TooltipValueFormatter, TooltipSettings, TooltipValue } from '../../specs';
import { onPointerMove as onPointerMoveAction } from '../../state/actions/mouse';
import { GlobalChartState, BackwardRef } from '../../state/chart_state';
import { getChartRotationSelector } from '../../state/selectors/get_chart_rotation';
import { getChartThemeSelector } from '../../state/selectors/get_chart_theme';
import { getInternalIsInitializedSelector, InitStatus } from '../../state/selectors/get_internal_is_intialized';
import { getInternalIsTooltipVisibleSelector } from '../../state/selectors/get_internal_is_tooltip_visible';
import { getInternalTooltipAnchorPositionSelector } from '../../state/selectors/get_internal_tooltip_anchor_position';
import { getInternalTooltipInfoSelector } from '../../state/selectors/get_internal_tooltip_info';
import { getSettingsSpecSelector } from '../../state/selectors/get_settings_specs';
import { getTooltipHeaderFormatterSelector } from '../../state/selectors/get_tooltip_header_formatter';
import { Rotation, isDefined } from '../../utils/common';
import { TooltipPortal, TooltipPortalSettings, AnchorPosition, Placement } from '../portal';
import { getTooltipSettings } from './get_tooltip_settings';
import { TooltipInfo } from './types';

interface TooltipDispatchProps {
  onPointerMove: typeof onPointerMoveAction;
}

interface TooltipStateProps {
  zIndex: number;
  visible: boolean;
  position: AnchorPosition | null;
  info?: TooltipInfo;
  headerFormatter?: TooltipValueFormatter;
  settings?: TooltipSettings;
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
  zIndex,
  headerFormatter,
  position,
  getChartContainerRef,
  settings,
  visible,
  rotation,
  chartId,
  onPointerMove,
  backgroundColor,
}: TooltipProps) => {
  const chartRef = getChartContainerRef();

  const handleScroll = () => {
    // TODO: handle scroll cursor update
    onPointerMove({ x: -1, y: -1 }, Date.now());
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

      return (
        <div className="echTooltip__header">{headerFormatter ? headerFormatter(header) : header.formattedValue}</div>
      );
    },
    [headerFormatter],
  );

  const renderValues = (values: TooltipValue[]) => (
    <div className="echTooltip__list">
      {values.map(
        (
          {
            seriesIdentifier,
            valueAccessor,
            label,
            markValue,
            formattedValue,
            formattedMarkValue,
            color,
            isHighlighted,
            isVisible,
          },
          index,
        ) => {
          if (!isVisible) {
            return null;
          }

          const classes = classNames('echTooltip__item', {
            echTooltip__rowHighlighted: isHighlighted,
          });
          const adjustedBGColor = isColorValid(color) && chroma(color).alpha() === 0 ? 'transparent' : backgroundColor;

          return (
            <div
              // NOTE: temporary to avoid errors
              key={`${seriesIdentifier.key}__${valueAccessor}__${index}`}
              className={classes}
              style={{
                borderLeftColor: color,
              }}
            >
              <div className="echTooltip__item--backgroundColor" style={{ backgroundColor: adjustedBGColor }}>
                <div className="echTooltip__item--color" style={{ backgroundColor: color }} />
              </div>

              <div className="echTooltip__item--container">
                <span className="echTooltip__label">{label}</span>
                <span className="echTooltip__value">{formattedValue}</span>
                {isDefined(markValue) && <span className="echTooltip__markValue">&nbsp;({formattedMarkValue})</span>}
              </div>
            </div>
          );
        },
      )}
    </div>
  );

  const renderTooltip = () => {
    if (!info || !visible) {
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

  const popperSettings = useMemo((): TooltipPortalSettings | undefined => {
    if (!settings || typeof settings === 'string') {
      return;
    }

    const { placement, fallbackPlacements, boundary, ...rest } = settings;

    return {
      ...rest,
      placement: placement ?? (rotation === 0 || rotation === 180 ? Placement.Right : Placement.Top),
      fallbackPlacements:
        fallbackPlacements ??
        (rotation === 0 || rotation === 180
          ? [Placement.Right, Placement.Left, Placement.Top, Placement.Bottom]
          : [Placement.Top, Placement.Bottom, Placement.Right, Placement.Left]),
      boundary: boundary === 'chart' ? chartRef.current ?? undefined : boundary,
    };
  }, [settings, chartRef, rotation]);

  if (!visible) {
    return null;
  }
  return (
    <TooltipPortal
      scope="MainTooltip"
      // increasing by 100 the tooltip portal zIndex to avoid conflicts with highlighters and other elements in the DOM
      zIndex={zIndex + 100}
      anchor={{
        position,
        ref: chartRef.current,
      }}
      settings={popperSettings}
      chartId={chartId}
      visible={visible}
    >
      {renderTooltip()}
    </TooltipPortal>
  );
};

TooltipComponent.displayName = 'Tooltip';

const HIDDEN_TOOLTIP_PROPS = {
  zIndex: 0,
  visible: false,
  info: undefined,
  position: null,
  headerFormatter: undefined,
  settings: {},
  rotation: 0 as Rotation,
  chartId: '',
  backgroundColor: 'transparent',
};

const mapDispatchToProps = (dispatch: Dispatch): TooltipDispatchProps =>
  bindActionCreators({ onPointerMove: onPointerMoveAction }, dispatch);

const mapStateToProps = (state: GlobalChartState): TooltipStateProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return HIDDEN_TOOLTIP_PROPS;
  }
  const { visible, isExternal } = getInternalIsTooltipVisibleSelector(state);

  const settingsSpec = getSettingsSpecSelector(state);
  const settings = getTooltipSettings(settingsSpec, isExternal);
  return {
    visible,
    zIndex: state.zIndex,
    info: getInternalTooltipInfoSelector(state),
    position: getInternalTooltipAnchorPositionSelector(state),
    headerFormatter: getTooltipHeaderFormatterSelector(state),
    settings,
    rotation: getChartRotationSelector(state),
    chartId: state.chartId,
    backgroundColor: getChartThemeSelector(state).background.color,
  };
};

/** @internal */
export const Tooltip = memo(connect(mapStateToProps, mapDispatchToProps)(TooltipComponent));
