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
      return <div className="echTooltip echTooltip--hidden" />;
    }
    return (
      <div className="echTooltip" style={{ transform: tooltipPosition.transform }}>
        <p className="echTooltip__header">{tooltipData[0] && tooltipData[0].value}</p>
        <div className="echTooltip__table">
          <table>
            <tbody>
              {tooltipData.slice(1).map(({ name, value, color, isHighlighted }, index) => {
                const classes = classNames({
                  echTooltip__rowHighlighted: isHighlighted,
                });
                return (
                  <tr key={`row-${index}`} className={classes}>
                    <td
                      className="echTooltip__label"
                      style={{
                        borderLeftColor: color,
                      }}
                    >
                      {name}
                    </td>
                    <td className="echTooltip__value">{value}</td>
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
