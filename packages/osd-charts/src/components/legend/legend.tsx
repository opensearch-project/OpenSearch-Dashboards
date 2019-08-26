import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import React, { createRef } from 'react';
import { isVertical, isHorizontal } from '../../chart_types/xy_chart/utils/axis_utils';
import { LegendItem as SeriesLegendItem } from '../../chart_types/xy_chart/legend/legend';
import { ChartStore } from '../../chart_types/xy_chart/store/chart_state';
import { Position } from '../../chart_types/xy_chart/utils/specs';
import { LegendItem } from './legend_item';
import { Theme } from '../../utils/themes/theme';

interface LegendProps {
  chartStore?: ChartStore; // FIX until we find a better way on ts mobx
}

interface LegendState {
  width?: number;
}

interface LegendStyle {
  maxHeight?: string;
  maxWidth?: string;
  width?: string;
}

interface LegendListStyle {
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  gridTemplateColumns?: string;
}

class LegendComponent extends React.Component<LegendProps, LegendState> {
  static displayName = 'Legend';

  state = {
    width: undefined,
  };

  private echLegend = createRef<HTMLDivElement>();

  componentDidUpdate() {
    const { chartInitialized, chartTheme, legendPosition } = this.props.chartStore!;
    if (
      this.echLegend.current &&
      isVertical(legendPosition.get()) &&
      this.state.width === undefined &&
      !chartInitialized.get()
    ) {
      const buffer = chartTheme.legend.spacingBuffer;

      this.setState({
        width: this.echLegend.current.offsetWidth + buffer,
      });
    }
  }

  render() {
    const {
      legendInitialized,
      chartInitialized,
      legendItems,
      legendPosition,
      showLegend,
      debug,
      chartTheme,
    } = this.props.chartStore!;
    const position = legendPosition.get();

    if (!showLegend.get() || !legendInitialized.get() || legendItems.size === 0) {
      return null;
    }

    const legendContainerStyle = this.getLegendStyle(position, chartTheme);
    const legendListStyle = this.getLegendListStyle(position, chartTheme);
    const legendClasses = classNames('echLegend', `echLegend--${position}`, {
      'echLegend--debug': debug,
      invisible: !chartInitialized.get(),
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

    if (isHorizontal(position)) {
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

  getLegendStyle = (position: Position, { legend }: Theme): LegendStyle => {
    if (isVertical(position)) {
      if (this.state.width !== undefined) {
        const threshold = Math.min(this.state.width!, legend.verticalWidth);
        const width = `${threshold}px`;

        return {
          width,
          maxWidth: width,
        };
      }

      return {
        maxWidth: `${legend.verticalWidth}px`,
      };
    }

    return {
      maxHeight: `${legend.horizontalHeight}px`,
    };
  };

  onLegendItemMouseover = (legendItemKey: string) => () => {
    this.props.chartStore!.onLegendItemOver(legendItemKey);
  };

  onLegendItemMouseout = () => {
    this.props.chartStore!.onLegendItemOut();
  };

  private renderLegendElement = (item: SeriesLegendItem) => {
    const { key, displayValue } = item;
    const { legendPosition, legendItemTooltipValues } = this.props.chartStore!;
    const tooltipValues = legendItemTooltipValues.get();
    let tooltipValue;

    if (tooltipValues && tooltipValues.get(key)) {
      tooltipValue = tooltipValues.get(key);
    }

    const newDisplayValue = tooltipValue != null ? tooltipValue : displayValue.formatted;

    return (
      <LegendItem
        {...item}
        key={key}
        legendItemKey={key}
        legendPosition={legendPosition.get()}
        displayValue={newDisplayValue}
        onMouseEnter={this.onLegendItemMouseover(key)}
        onMouseLeave={this.onLegendItemMouseout}
      />
    );
  };
}

export const Legend = inject('chartStore')(observer(LegendComponent));
