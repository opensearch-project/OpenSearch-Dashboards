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

import React from 'react';
import { connect } from 'react-redux';

import { Line, Rect } from '../../../../geoms/types';
import { getTooltipType } from '../../../../specs';
import { TooltipType } from '../../../../specs/constants';
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getInternalIsInitializedSelector, InitStatus } from '../../../../state/selectors/get_internal_is_intialized';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { Rotation } from '../../../../utils/common';
import { LIGHT_THEME } from '../../../../utils/themes/light_theme';
import { Theme } from '../../../../utils/themes/theme';
import { getCursorBandPositionSelector } from '../../state/selectors/get_cursor_band';
import { getCursorLinePositionSelector } from '../../state/selectors/get_cursor_line';

interface CrosshairProps {
  theme: Theme;
  chartRotation: Rotation;
  cursorPosition?: Rect;
  cursorCrossLinePosition?: Line;
  tooltipType: TooltipType;
  fromExternalEvent?: boolean;
  zIndex: number;
}

function canRenderBand(type: TooltipType, visible: boolean, fromExternalEvent?: boolean) {
  return visible && (type === TooltipType.Crosshairs || type === TooltipType.VerticalCursor || fromExternalEvent);
}

function canRenderHelpLine(type: TooltipType, visible: boolean) {
  return visible && type === TooltipType.Crosshairs;
}

class CrosshairComponent extends React.Component<CrosshairProps> {
  static displayName = 'Crosshair';

  renderCursor() {
    const {
      zIndex,
      theme: {
        crosshair: { band, line },
      },
      cursorPosition,
      tooltipType,
      fromExternalEvent,
    } = this.props;

    if (!cursorPosition || !canRenderBand(tooltipType, band.visible, fromExternalEvent)) {
      return null;
    }
    const { x, y, width, height } = cursorPosition;
    const isLine = width === 0 || height === 0;
    const { strokeWidth, stroke, dash } = line;
    const { fill } = band;
    const strokeDasharray = (dash ?? []).join(' ');
    return (
      <svg
        className="echCrosshair__cursor"
        width="100%"
        height="100%"
        style={{ zIndex: cursorPosition && isLine ? zIndex : undefined }}
      >
        {isLine && <line {...{ x1: x, x2: x + width, y1: y, y2: y + height, strokeWidth, stroke, strokeDasharray }} />}
        {!isLine && <rect {...{ x, y, width, height, fill }} />}
      </svg>
    );
  }

  renderCrossLine() {
    const {
      zIndex,
      theme: {
        crosshair: { crossLine },
      },
      cursorCrossLinePosition,
      tooltipType,
    } = this.props;

    if (!cursorCrossLinePosition || !canRenderHelpLine(tooltipType, crossLine.visible)) {
      return null;
    }

    const { strokeWidth, stroke, dash } = crossLine;
    const style = {
      strokeWidth,
      stroke,
      strokeDasharray: (dash ?? []).join(' '),
    };

    return (
      <svg className="echCrosshair__crossLine" width="100%" height="100%" style={{ zIndex }}>
        <line {...cursorCrossLinePosition} {...style} />
      </svg>
    );
  }

  render() {
    return (
      <>
        {this.renderCursor()}
        {this.renderCrossLine()}
      </>
    );
  }
}

const mapStateToProps = (state: GlobalChartState): CrosshairProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return {
      theme: LIGHT_THEME,
      chartRotation: 0,
      tooltipType: TooltipType.None,
      zIndex: 0,
    };
  }
  const settings = getSettingsSpecSelector(state);
  const cursorBandPosition = getCursorBandPositionSelector(state);
  const fromExternalEvent = cursorBandPosition?.fromExternalEvent;
  const tooltipType = getTooltipType(settings, fromExternalEvent);

  return {
    theme: getChartThemeSelector(state),
    chartRotation: getChartRotationSelector(state),
    cursorPosition: cursorBandPosition,
    cursorCrossLinePosition: getCursorLinePositionSelector(state),
    tooltipType,
    fromExternalEvent,
    zIndex: state.zIndex,
  };
};

/** @internal */
export const Crosshair = connect(mapStateToProps)(CrosshairComponent);
