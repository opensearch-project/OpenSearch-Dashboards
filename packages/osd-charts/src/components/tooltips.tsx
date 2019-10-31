import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { createPortal } from 'react-dom';
import { TooltipValue, TooltipValueFormatter } from '../chart_types/xy_chart/utils/interactions';
import { ChartStore } from '../chart_types/xy_chart/store/chart_state';
import { getFinalTooltipPosition } from '../chart_types/xy_chart/crosshair/crosshair_utils';

interface TooltipProps {
  chartStore?: ChartStore;
  getChartContainerRef: () => React.RefObject<HTMLDivElement>;
}

class TooltipsComponent extends React.Component<TooltipProps> {
  static displayName = 'Tooltips';
  portalNode: HTMLDivElement | null = null;
  tooltipRef: React.RefObject<HTMLDivElement>;

  constructor(props: TooltipProps) {
    super(props);
    this.tooltipRef = React.createRef();
  }
  createPortalNode() {
    const container = document.getElementById('echTooltipContainerPortal');
    if (container) {
      this.portalNode = container as HTMLDivElement;
    } else {
      this.portalNode = document.createElement('div');
      this.portalNode.id = 'echTooltipContainerPortal';
      document.body.appendChild(this.portalNode);
    }
  }
  componentDidMount() {
    this.createPortalNode();
  }

  componentDidUpdate() {
    this.createPortalNode();
    const { getChartContainerRef } = this.props;
    const { tooltipPosition } = this.props.chartStore!;
    const chartContainerRef = getChartContainerRef();

    if (!this.tooltipRef.current || !chartContainerRef.current || !this.portalNode) {
      return;
    }

    const chartContainerBBox = chartContainerRef.current.getBoundingClientRect();
    const tooltipBBox = this.tooltipRef.current.getBoundingClientRect();
    const tooltipStyle = getFinalTooltipPosition(chartContainerBBox, tooltipBBox, tooltipPosition);

    this.portalNode.style.left = tooltipStyle.left;
    this.portalNode.style.top = tooltipStyle.top;
  }

  componentWillUnmount() {
    if (this.portalNode && this.portalNode.parentNode) {
      this.portalNode.parentNode.removeChild(this.portalNode);
    }
  }

  renderHeader(headerData?: TooltipValue, formatter?: TooltipValueFormatter) {
    if (!headerData) {
      return null;
    }

    return formatter ? formatter(headerData) : headerData.value;
  }

  render() {
    const { isTooltipVisible, tooltipData, tooltipHeaderFormatter } = this.props.chartStore!;
    const isVisible = isTooltipVisible.get();
    let tooltip;
    if (!this.portalNode) {
      return null;
    }
    const { getChartContainerRef } = this.props;
    const chartContainerRef = getChartContainerRef();
    if (chartContainerRef.current === null || !isVisible) {
      return null;
    } else {
      tooltip = (
        <div className="echTooltip" ref={this.tooltipRef}>
          <div className="echTooltip__header">{this.renderHeader(tooltipData[0], tooltipHeaderFormatter)}</div>
          <div className="echTooltip__list">
            {tooltipData.slice(1).map(({ name, value, color, isHighlighted, seriesKey, yAccessor }) => {
              const classes = classNames('echTooltip__item', {
                /* eslint @typescript-eslint/camelcase:0 */
                echTooltip__rowHighlighted: isHighlighted,
              });
              return (
                <div
                  key={`${seriesKey}--${yAccessor}`}
                  className={classes}
                  style={{
                    borderLeftColor: color,
                  }}
                >
                  <span className="echTooltip__label">{name}</span>
                  <span className="echTooltip__value">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return createPortal(tooltip, this.portalNode);
  }
}

export const Tooltips = inject('chartStore')(observer(TooltipsComponent));
