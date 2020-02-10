import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { deepEqual } from '../../../../utils/fast_deep_equal';
import { Rotation } from '../../utils/specs';
import { Theme } from '../../../../utils/themes/theme';
import { Dimensions } from '../../../../utils/dimensions';
import { BarGeometry } from '../../../../utils/geometry';
import { buildBarValueProps } from './bar_values_utils';
import { connect } from 'react-redux';
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { computeChartDimensionsSelector } from '../../state/selectors/compute_chart_dimensions';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { computeSeriesGeometriesSelector } from '../../state/selectors/compute_series_geometries';
import { LIGHT_THEME } from '../../../../utils/themes/light_theme';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { ChartTypes } from '../../..';

interface BarValuesProps {
  theme: Theme;
  chartDimensions: Dimensions;
  chartRotation: Rotation;
  debug: boolean;
  bars: BarGeometry[];
}

export class BarValuesComponent extends React.Component<BarValuesProps> {
  shouldComponentUpdate(nextProps: BarValuesProps) {
    return !deepEqual(this.props, nextProps);
  }

  render() {
    const { chartDimensions, bars } = this.props;
    if (!bars) {
      return;
    }

    return (
      <Group x={chartDimensions.left} y={chartDimensions.top}>
        {this.renderBarValues()}
      </Group>
    );
  }

  private renderBarValues = () => {
    const { bars, debug, chartRotation, chartDimensions, theme } = this.props;
    const displayValueStyle = theme.barSeriesStyle.displayValue;

    return bars.map((bar, index) => {
      const { displayValue, x, y, height, width } = bar;
      if (!displayValue) {
        return;
      }

      const key = `bar-value-${index}`;
      const displayValueProps = buildBarValueProps({
        x,
        y,
        barHeight: height,
        barWidth: width,
        displayValueStyle,
        displayValue,
        chartRotation,
        chartDimensions,
      });

      const debugProps = {
        ...displayValueProps,
        stroke: 'violet',
        strokeWidth: 1,
        fill: 'transparent',
      };

      return (
        <Group key={key}>
          {debug && <Rect {...debugProps} />}
          {displayValue && <Text {...displayValueProps} />}
        </Group>
      );
    });
  };
}

const mapStateToProps = (state: GlobalChartState): BarValuesProps => {
  // check for correct chartType required because <BarValues /> live in a different
  // redux context (see ReactiveChart render method)
  if (!state.specsInitialized || state.chartType !== ChartTypes.XYAxis) {
    return {
      theme: LIGHT_THEME,
      chartDimensions: {
        width: 0,
        left: 0,
        top: 0,
        height: 0,
      },
      chartRotation: 0,
      debug: false,
      bars: [],
    };
  }
  const geometries = computeSeriesGeometriesSelector(state);
  return {
    theme: getChartThemeSelector(state),
    chartDimensions: computeChartDimensionsSelector(state).chartDimensions,
    chartRotation: getChartRotationSelector(state),
    debug: getSettingsSpecSelector(state).debug,
    bars: geometries.geometries.bars,
  };
};

export const BarValues = connect(mapStateToProps)(BarValuesComponent);
