import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { isVertical } from '../lib/axes/axis_utils';
import { LegendItem } from '../lib/series/legend';
import { ChartStore } from '../state/chart_state';
import { LegendElement } from './legend_element';

interface ReactiveChartProps {
  chartStore?: ChartStore; // FIX until we find a better way on ts mobx
}

class LegendComponent extends React.Component<ReactiveChartProps> {
  static displayName = 'Legend';

  onCollapseLegend = () => {
    this.props.chartStore!.toggleLegendCollapsed();
  }

  render() {
    const {
      initialized,
      legendItems,
      legendPosition,
      showLegend,
      legendCollapsed,
      debug,
      chartTheme,
    } = this.props.chartStore!;

    if (
      !showLegend.get() ||
      !initialized.get() ||
      legendItems.size === 0 ||
      legendPosition === undefined
    ) {
      return null;
    }

    const legendClasses = classNames(
      'elasticChartsLegend',
      `elasticChartsLegend--${legendPosition}`,
      {
        'elasticChartsLegend--collapsed': legendCollapsed.get(),
        'elasticChartsLegend--debug': debug,
      },
    );
    let paddingStyle;
    let legendItemGrow = false;
    if (isVertical(legendPosition)) {
      paddingStyle = {
        paddingTop: chartTheme.chartMargins.top,
        paddingBottom: chartTheme.chartMargins.bottom,
      };
      legendItemGrow = true;
    } else {
      paddingStyle = {
        paddingLeft: chartTheme.chartMargins.left,
        paddingRight: chartTheme.chartMargins.right,
      };
      legendItemGrow = true;
    }
    return (
      <div className={legendClasses} style={paddingStyle}>
        <div className="elasticChartsLegendList">
          <EuiFlexGroup
            gutterSize="s"
            wrap
            className="elasticChartsLegendListContainer"
            responsive={false}
          >
            {[...legendItems.values()].map((item) => {
              const { isLegendItemVisible } = item;

              const legendItemProps = {
                key: item.key,
                className: classNames('elasticChartsLegendList__item', 'euiIEFlexWrapFix', {
                  'elasticChartsLegendList__item--hidden': !isLegendItemVisible,
                }),
                onMouseEnter: this.onLegendItemMouseover(item.key),
                onMouseLeave: this.onLegendItemMouseout,
              };

              return (
                <EuiFlexItem className={legendItemProps.className}>
                  {this.renderLegendElement(item, item.key, legendItemGrow, legendItemProps)}
                </EuiFlexItem>
              );
            })}
          </EuiFlexGroup>
        </div>
      </div>
    );
  }

  private onLegendItemMouseover = (legendItemKey: string) => () => {
    this.props.chartStore!.onLegendItemOver(legendItemKey);
  }

  private onLegendItemMouseout = () => {
    this.props.chartStore!.onLegendItemOut();
  }

  private renderLegendElement = (
    { color, label, isSeriesVisible, displayValue }: LegendItem,
    legendItemKey: string,
    legendItemGrow: boolean,
    containerProps: {
      key: string;
      className: string;
      onMouseEnter: (key: React.MouseEvent) => void;
      onMouseLeave: () => void;
    },
  ) => {
    const tooltipValues = this.props.chartStore!.legendItemTooltipValues.get();
    let tooltipValue;

    if (tooltipValues && tooltipValues.get(legendItemKey)) {
      tooltipValue = tooltipValues.get(legendItemKey);
    }

    const display = tooltipValue != null ? tooltipValue : displayValue.formatted;
    const props = { color, label, isSeriesVisible, legendItemKey, displayValue: display };

    return <LegendElement {...props} {...containerProps} />;
  }
}

export const Legend = inject('chartStore')(observer(LegendComponent));
