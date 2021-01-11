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

import React, { CSSProperties } from 'react';
import { connect } from 'react-redux';

import { getTooltipType } from '../../../../specs';
import { TooltipType } from '../../../../specs/constants';
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getInternalIsInitializedSelector, InitStatus } from '../../../../state/selectors/get_internal_is_intialized';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { Rotation } from '../../../../utils/commons';
import { Dimensions } from '../../../../utils/dimensions';
import { LIGHT_THEME } from '../../../../utils/themes/light_theme';
import { Theme } from '../../../../utils/themes/theme';
import { getCursorBandPositionSelector } from '../../state/selectors/get_cursor_band';
import { getCursorLinePositionSelector } from '../../state/selectors/get_cursor_line';
import { isHorizontalRotation } from '../../state/utils/common';

interface CrosshairProps {
  theme: Theme;
  chartRotation: Rotation;
  cursorBandPosition?: Dimensions;
  cursorLinePosition?: Dimensions;
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

  renderBand() {
    const {
      theme: {
        crosshair: { band },
      },
      cursorBandPosition,
      tooltipType,
      fromExternalEvent,
    } = this.props;

    if (!cursorBandPosition || !canRenderBand(tooltipType, band.visible, fromExternalEvent)) {
      return null;
    }
    const style: CSSProperties = {
      ...cursorBandPosition,
      background: band.fill,
    };

    return <div className="echCrosshair__band" style={style} />;
  }

  renderLine() {
    const {
      theme: {
        crosshair: { line },
      },
      cursorLinePosition,
      tooltipType,
      chartRotation,
      zIndex,
    } = this.props;

    if (!cursorLinePosition || !canRenderHelpLine(tooltipType, line.visible)) {
      return null;
    }
    const isHorizontalRotated = isHorizontalRotation(chartRotation);

    const style: CSSProperties = isHorizontalRotated
      ? {
          ...cursorLinePosition,
          borderTopWidth: line.strokeWidth,
          borderTopColor: line.stroke,
          borderTopStyle: line.dash ? 'dashed' : 'solid',
          zIndex,
        }
      : {
          ...cursorLinePosition,
          borderLeftWidth: line.strokeWidth,
          borderLeftColor: line.stroke,
          borderLeftStyle: line.dash ? 'dashed' : 'solid',
          zIndex,
        };
    return <div className="echCrosshair__line" style={style} />;
  }

  render() {
    return (
      <div className="echCrosshair">
        {this.renderBand()}
        {this.renderLine()}
      </div>
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
  const tooltipType = getTooltipType(settings, cursorBandPosition?.fromExternalEvent);

  return {
    theme: getChartThemeSelector(state),
    chartRotation: getChartRotationSelector(state),
    cursorBandPosition,
    cursorLinePosition: getCursorLinePositionSelector(state),
    tooltipType,
    fromExternalEvent: cursorBandPosition?.fromExternalEvent,
    zIndex: state.zIndex,
  };
};

/** @internal */
export const Crosshair = connect(mapStateToProps)(CrosshairComponent);
