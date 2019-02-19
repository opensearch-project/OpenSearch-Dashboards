import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiText } from '@elastic/eui';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { isVertical } from '../lib/axes/axis_utils';
import { LegendItem } from '../lib/series/legend';
import { ChartStore } from '../state/chart_state';

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
      legendItems.length === 0 ||
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
            {legendItems.map((item, index) => {
              const legendItemProps = {
                key: index,
                className: 'elasticChartsLegendList__item',
                onMouseEnter: this.onLegendItemMouseover(index),
                onMouseLeave: this.onLegendItemMouseout,
              };

              return (
                <EuiFlexItem {...legendItemProps}>
                  <LegendElement color={item.color} label={item.label} />
                </EuiFlexItem>
              );
            })}
          </EuiFlexGroup>
        </div>
      </div>
    );
  }

  private onLegendItemMouseover = (legendItemIndex: number) => () => {
    this.props.chartStore!.onLegendItemOver(legendItemIndex);
  }

  private onLegendItemMouseout = () => {
    this.props.chartStore!.onLegendItemOut();
  }
}
function LegendElement({ color, label }: Partial<LegendItem>) {
  return (
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiIcon type="dot" color={color} />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexItem grow={true} className="elasticChartsLegendListItem__title" title={label}>
          <EuiText size="xs" className="eui-textTruncate">
            {label}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

export const Legend = inject('chartStore')(observer(LegendComponent));
