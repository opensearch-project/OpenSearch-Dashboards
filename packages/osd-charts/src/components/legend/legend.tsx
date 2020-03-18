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

import React, { createRef } from 'react';
import classNames from 'classnames';
import { Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Position } from '../../utils/commons';
import { GlobalChartState } from '../../state/chart_state';
import { getLegendItemsSelector } from '../../state/selectors/get_legend_items';
import { getSettingsSpecSelector } from '../../state/selectors/get_settings_specs';
import { getChartThemeSelector } from '../../state/selectors/get_chart_theme';
import { getLegendItemsValuesSelector } from '../../state/selectors/get_legend_items_values';
import { getLegendSizeSelector } from '../../state/selectors/get_legend_size';
import { onToggleLegend } from '../../state/actions/legend';
import { LIGHT_THEME } from '../../utils/themes/light_theme';
import { LegendListItem } from './legend_item';
import { Theme } from '../../utils/themes/theme';
import { TooltipLegendValue } from '../../chart_types/xy_chart/tooltip/tooltip';
import { LegendItem, getItemLabel } from '../../chart_types/xy_chart/legend/legend';
import { BBox } from '../../utils/bbox/bbox_calculator';
import {
  onToggleDeselectSeriesAction,
  onLegendItemOutAction,
  onLegendItemOverAction,
} from '../../state/actions/legend';
import { clearTemporaryColors, setTemporaryColor, setPersistedColor } from '../../state/actions/colors';
import { SettingsSpec } from '../../specs';
import { BandedAccessorType } from '../../utils/geometry';
import { SeriesKey } from '../../chart_types/xy_chart/utils/series';

interface LegendStateProps {
  legendItems: Map<SeriesKey, LegendItem>;
  legendPosition: Position;
  legendItemTooltipValues: Map<string, TooltipLegendValue>;
  showLegend: boolean;
  legendCollapsed: boolean;
  debug: boolean;
  chartTheme: Theme;
  legendSize: BBox;
  settings?: SettingsSpec;
}
interface LegendDispatchProps {
  onToggleLegend: typeof onToggleLegend;
  onLegendItemOutAction: typeof onLegendItemOutAction;
  onLegendItemOverAction: typeof onLegendItemOverAction;
  onToggleDeselectSeriesAction: typeof onToggleDeselectSeriesAction;
  clearTemporaryColors: typeof clearTemporaryColors;
  setTemporaryColor: typeof setTemporaryColor;
  setPersistedColor: typeof setPersistedColor;
}
type LegendProps = LegendStateProps & LegendDispatchProps;

interface LegendStyle {
  maxHeight?: string;
  maxWidth?: string;
  width?: string;
  height?: string;
}

interface LegendListStyle {
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  gridTemplateColumns?: string;
}

class LegendComponent extends React.Component<LegendProps> {
  static displayName = 'Legend';
  legendItemCount = 0;

  private echLegend = createRef<HTMLDivElement>();

  render() {
    const { legendItems, legendPosition, legendSize, showLegend, debug, chartTheme } = this.props;
    if (!showLegend || legendItems.size === 0) {
      return null;
    }
    const legendContainerStyle = this.getLegendStyle(legendPosition, legendSize);
    const legendListStyle = this.getLegendListStyle(legendPosition, chartTheme);
    const legendClasses = classNames('echLegend', `echLegend--${legendPosition}`, {
      'echLegend--debug': debug,
    });

    return (
      <div ref={this.echLegend} className={legendClasses}>
        <div style={legendContainerStyle} className="echLegendListContainer">
          <div style={legendListStyle} className="echLegendList">
            {[...legendItems.values()].map(this.renderLegendElement)}
          </div>
        </div>
      </div>
    );
  }

  getLegendListStyle = (position: Position, { chartMargins, legend }: Theme): LegendListStyle => {
    const { top: paddingTop, bottom: paddingBottom, left: paddingLeft, right: paddingRight } = chartMargins;

    if (position === Position.Bottom || position === Position.Top) {
      return {
        paddingLeft,
        paddingRight,
        gridTemplateColumns: `repeat(auto-fill, minmax(${legend.verticalWidth}px, 1fr))`,
      };
    }

    return {
      paddingTop,
      paddingBottom,
    };
  };

  getLegendStyle = (position: Position, size: BBox): LegendStyle => {
    if (position === Position.Left || position === Position.Right) {
      const width = `${size.width}px`;
      return {
        width,
        maxWidth: width,
      };
    }
    const height = `${size.height}px`;
    return {
      height,
      maxHeight: height,
    };
  };

  private getLegendValues(
    tooltipValues: Map<SeriesKey, TooltipLegendValue> | undefined,
    key: SeriesKey,
    banded: boolean = false,
  ): any[] {
    const values = tooltipValues && tooltipValues.get(key);
    if (values === null || values === undefined) {
      return banded ? ['', ''] : [''];
    }

    const { y0, y1 } = values;
    return banded ? [y1, y0] : [y1];
  }

  private renderLegendElement = (item: LegendItem) => {
    if (!this.props.settings) {
      return null;
    }
    const { key, displayValue, banded } = item;
    const { legendItemTooltipValues, settings } = this.props;
    const { showLegendExtra, legendPosition, legendColorPicker } = settings;
    const legendValues = this.getLegendValues(legendItemTooltipValues, key, banded);
    return legendValues.map((value, index) => {
      const yAccessor: BandedAccessorType = index === 0 ? BandedAccessorType.Y1 : BandedAccessorType.Y0;
      return (
        <LegendListItem
          key={`${key}-${yAccessor}`}
          legendItem={item}
          legendColorPicker={legendColorPicker}
          legendPosition={legendPosition}
          label={getItemLabel(item, yAccessor)}
          extra={value !== '' ? value : displayValue.formatted[yAccessor]}
          showExtra={showLegendExtra}
          toggleDeselectSeriesAction={this.props.onToggleDeselectSeriesAction}
          legendItemOutAction={this.props.onLegendItemOutAction}
          legendItemOverAction={this.props.onLegendItemOverAction}
          clearTemporaryColors={this.props.clearTemporaryColors}
          setTemporaryColor={this.props.setTemporaryColor}
          setPersistedColor={this.props.setPersistedColor}
          onLegendItemOverListener={settings.onLegendItemOver}
          onLegendItemOutListener={settings.onLegendItemOut}
          onLegendItemClickListener={settings.onLegendItemClick}
        />
      );
    });
  };
}

const mapDispatchToProps = (dispatch: Dispatch): LegendDispatchProps =>
  bindActionCreators(
    {
      onToggleLegend,
      onToggleDeselectSeriesAction,
      onLegendItemOutAction,
      onLegendItemOverAction,
      clearTemporaryColors,
      setTemporaryColor,
      setPersistedColor,
    },
    dispatch,
  );

const EMPTY_DEFAULT_STATE = {
  legendItems: new Map(),
  legendPosition: Position.Right,
  showLegend: false,
  legendCollapsed: false,
  legendItemTooltipValues: new Map(),
  debug: false,
  chartTheme: LIGHT_THEME,
  legendSize: { width: 0, height: 0 },
};
const mapStateToProps = (state: GlobalChartState): LegendStateProps => {
  if (!state.specsInitialized) {
    return EMPTY_DEFAULT_STATE;
  }
  const { legendPosition, showLegend, debug } = getSettingsSpecSelector(state);
  if (!showLegend) {
    return EMPTY_DEFAULT_STATE;
  }
  const legendItems = getLegendItemsSelector(state);
  return {
    legendItems,
    legendPosition,
    showLegend,
    legendCollapsed: state.interactions.legendCollapsed,
    legendItemTooltipValues: getLegendItemsValuesSelector(state),
    debug,
    chartTheme: getChartThemeSelector(state),
    legendSize: getLegendSizeSelector(state),
    settings: getSettingsSpecSelector(state),
  };
};

/** @internal */
export const Legend = connect(mapStateToProps, mapDispatchToProps)(LegendComponent);
