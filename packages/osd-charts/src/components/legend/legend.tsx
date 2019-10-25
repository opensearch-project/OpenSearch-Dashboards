import React, { createRef } from 'react';
import { inject, observer } from 'mobx-react';
import classNames from 'classnames';

import { isVerticalAxis, isHorizontalAxis } from '../../chart_types/xy_chart/utils/axis_utils';
import { LegendItem as SeriesLegendItem } from '../../chart_types/xy_chart/legend/legend';
import { ChartStore } from '../../chart_types/xy_chart/store/chart_state';
import { Position } from '../../chart_types/xy_chart/utils/specs';
import { LegendItem } from './legend_item';
import { Theme } from '../../utils/themes/theme';
import { TooltipLegendValue } from '../../chart_types/xy_chart/tooltip/tooltip';
import { AccessorType } from '../../chart_types/xy_chart/rendering/rendering';

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
  legendItemCount = 0;

  state = {
    width: undefined,
  };

  private echLegend = createRef<HTMLDivElement>();

  componentDidUpdate() {
    this.tryLegendResize();
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

  tryLegendResize = () => {
    const { chartInitialized, chartTheme, legendPosition, legendItems } = this.props.chartStore!;
    const { width } = this.state;

    if (
      this.echLegend.current &&
      isVerticalAxis(legendPosition.get()) &&
      !chartInitialized.get() &&
      width === undefined &&
      this.echLegend.current.offsetWidth > 0
    ) {
      const buffer = chartTheme.legend.spacingBuffer;
      this.legendItemCount = legendItems.size;

      return this.setState({
        width: this.echLegend.current.offsetWidth + buffer,
      });
    }

    // Need to reset width to enable downsizing of width
    if (width !== undefined && legendItems.size !== this.legendItemCount) {
      this.legendItemCount = legendItems.size;

      this.setState({
        width: undefined,
      });
    }
  };

  getLegendListStyle = (position: Position, { chartMargins, legend }: Theme): LegendListStyle => {
    const { top: paddingTop, bottom: paddingBottom, left: paddingLeft, right: paddingRight } = chartMargins;

    if (isHorizontalAxis(position)) {
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
    if (isVerticalAxis(position)) {
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

  private getLegendValues(
    tooltipValues: Map<string, TooltipLegendValue> | undefined,
    key: string,
    banded: boolean = false,
  ): any[] {
    const values = tooltipValues && tooltipValues.get(key);
    if (values === null || values === undefined) {
      return banded ? ['', ''] : [''];
    }

    const { y0, y1 } = values;
    return banded ? [y1, y0] : [y1];
  }

  private getItemLabel(
    { banded, label, y1AccessorFormat, y0AccessorFormat }: SeriesLegendItem,
    yAccessor: AccessorType,
  ) {
    if (!banded) {
      return label;
    }

    return yAccessor === AccessorType.Y1 ? `${label}${y1AccessorFormat}` : `${label}${y0AccessorFormat}`;
  }

  private renderLegendElement = (item: SeriesLegendItem) => {
    const { key, displayValue, banded } = item;
    const { legendPosition, legendItemTooltipValues, isCursorOnChart } = this.props.chartStore!;
    const tooltipValues = legendItemTooltipValues.get();
    const legendValues = this.getLegendValues(tooltipValues, key, banded);

    return legendValues.map((value, index) => {
      const yAccessor: AccessorType = index === 0 ? AccessorType.Y1 : AccessorType.Y0;
      return (
        <LegendItem
          {...item}
          label={this.getItemLabel(item, yAccessor)}
          key={`${key}-${yAccessor}`}
          legendItemKey={key}
          legendPosition={legendPosition.get()}
          displayValue={isCursorOnChart.get() ? value : displayValue.formatted[yAccessor]}
          onMouseEnter={this.onLegendItemMouseover(key)}
          onMouseLeave={this.onLegendItemMouseout}
        />
      );
    });
  };
}

export const Legend = inject('chartStore')(observer(LegendComponent));
