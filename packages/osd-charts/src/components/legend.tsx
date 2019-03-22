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
    if (isVertical(legendPosition)) {
      paddingStyle = {
        paddingTop: chartTheme.chartMargins.top,
        paddingBottom: chartTheme.chartMargins.bottom,
      };
    } else {
      paddingStyle = {
        paddingLeft: chartTheme.chartMargins.left,
        paddingRight: chartTheme.chartMargins.right,
      };
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
              const legendItemProps = {
                key: item.key,
                className: 'elasticChartsLegendList__item',
                onMouseEnter: this.onLegendItemMouseover(item.key),
                onMouseLeave: this.onLegendItemMouseout,
              };

              const { color, label, isVisible } = item;

              return (
                <EuiFlexItem {...legendItemProps}>
                  {this.renderLegendElement({ color, label, isVisible }, item.key)}
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
    { color, label, isVisible }: Partial<LegendItem>,
    legendItemKey: string,
  ) => {
    const props = { color, label, isVisible, legendItemKey };

    return <LegendElement {...props} />;
  }
}

export const Legend = inject('chartStore')(observer(LegendComponent));
