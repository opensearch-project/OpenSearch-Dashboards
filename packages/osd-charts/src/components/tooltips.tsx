import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { ChartStore } from '../state/chart_state';

interface TooltipProps {
  chartStore?: ChartStore;
}

class TooltipsComponent extends React.Component<TooltipProps> {
  static displayName = 'Tooltips';

  render() {
    const { isTooltipVisible, tooltipData, tooltipPosition } = this.props.chartStore!;
    if (!isTooltipVisible.get()) {
      return <div className="elasticChartsTooltip elasticChartsTooltip--hidden" />;
    }
    return (
      <div className="elasticChartsTooltip" style={{ transform: tooltipPosition.transform }}>
        <p className="elasticChartsTooltip__header">{tooltipData[0] && tooltipData[0].value}</p>
        <div className="elasticChartsTooltip__table">
          <table>
            <tbody>
              {tooltipData.slice(1).map(({ name, value, color, isHighlighted }, index) => {
                const classes = classNames({
                  elasticChartsTooltip__rowHighlighted: isHighlighted,
                });
                return (
                  <tr key={`row-${index}`} className={classes}>
                    <td
                      className="elasticChartsTooltip__label"
                      style={{
                        borderLeftColor: color,
                      }}
                    >
                      {name}
                    </td>
                    <td>{value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export const Tooltips = inject('chartStore')(observer(TooltipsComponent));
