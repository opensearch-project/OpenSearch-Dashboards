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
 * under the License. */

import React, { CSSProperties } from 'react';
import { connect } from 'react-redux';
import { isHorizontalRotation } from '../../state/utils';
import { Dimensions } from '../../../../utils/dimensions';
import { Theme } from '../../../../utils/themes/theme';
import { Rotation } from '../../../../utils/commons';
import { GlobalChartState } from '../../../../state/chart_state';
import { isInitialized } from '../../../../state/selectors/is_initialized';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { getCursorBandPositionSelector } from '../../state/selectors/get_cursor_band';
import { getCursorLinePositionSelector } from '../../state/selectors/get_cursor_line';
import { getTooltipTypeSelector } from '../../state/selectors/get_tooltip_type';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { LIGHT_THEME } from '../../../../utils/themes/light_theme';
import { TooltipType } from '../../../../specs';

interface CrosshairProps {
  theme: Theme;
  chartRotation: Rotation;
  cursorBandPosition?: Dimensions;
  cursorLinePosition?: Dimensions;
  tooltipType: TooltipType;
}

function canRenderBand(type: TooltipType, visible: boolean) {
  return visible && (type === TooltipType.Crosshairs || type === TooltipType.VerticalCursor);
}
function canRenderHelpLine(type: TooltipType, visible: boolean) {
  return visible && type === TooltipType.Crosshairs;
}

class CrosshairComponent extends React.Component<CrosshairProps> {
  static displayName = 'Crosshair';

  render() {
    return (
      <div className="echCrosshair">
        {this.renderBand()}
        {this.renderLine()}
      </div>
    );
  }

  renderBand() {
    const {
      theme: {
        crosshair: { band },
      },
      cursorBandPosition,
      tooltipType,
    } = this.props;

    if (!cursorBandPosition || !canRenderBand(tooltipType, band.visible)) {
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
    } = this.props;

    if (!cursorLinePosition || !canRenderHelpLine(tooltipType, line.visible)) {
      return null;
    }
    const isHorizontalRotated = isHorizontalRotation(chartRotation);
    let style: CSSProperties;
    if (isHorizontalRotated) {
      style = {
        ...cursorLinePosition,
        borderTopWidth: line.strokeWidth,
        borderTopColor: line.stroke,
        borderTopStyle: line.dash ? 'dashed' : 'solid',
      };
    } else {
      style = {
        ...cursorLinePosition,
        borderLeftWidth: line.strokeWidth,
        borderLeftColor: line.stroke,
        borderLeftStyle: line.dash ? 'dashed' : 'solid',
      };
    }
    return <div className="echCrosshair__line" style={style} />;
  }
}

const mapStateToProps = (state: GlobalChartState): CrosshairProps => {
  if (!isInitialized(state)) {
    return {
      theme: LIGHT_THEME,
      chartRotation: 0,
      tooltipType: TooltipType.None,
    };
  }
  return {
    theme: getChartThemeSelector(state),
    chartRotation: getChartRotationSelector(state),
    cursorBandPosition: getCursorBandPositionSelector(state),
    cursorLinePosition: getCursorLinePositionSelector(state),
    tooltipType: getTooltipTypeSelector(state) || TooltipType.VerticalCursor,
  };
};

/** @internal */
export const Crosshair = connect(mapStateToProps)(CrosshairComponent);
