import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { TooltipValue, TooltipValueFormatter } from '../../utils/interactions';
import { GlobalChartState, BackwardRef } from '../../../../state/chart_state';
import { isTooltipVisibleSelector } from '../../state/selectors/is_tooltip_visible';
import { getTooltipHeaderFormatterSelector } from '../../state/selectors/get_tooltip_header_formatter';
import { getTooltipPositionSelector } from '../../state/selectors/get_tooltip_position';
import { getTooltipValuesSelector, TooltipData } from '../../state/selectors/get_tooltip_values_highlighted_geoms';
import { isInitialized } from '../../../../state/selectors/is_initialized';
import { createPortal } from 'react-dom';
import { getFinalTooltipPosition, TooltipPosition } from '../../crosshair/crosshair_utils';
import { isAnnotationTooltipVisibleSelector } from '../../state/selectors/is_annotation_tooltip_visible';

interface TooltipStateProps {
  isTooltipVisible: boolean;
  isAnnotationTooltipVisible: boolean;
  tooltip: TooltipData;
  tooltipPosition: TooltipPosition | null;
  tooltipHeaderFormatter?: TooltipValueFormatter;
}
interface TooltipOwnProps {
  getChartContainerRef: BackwardRef;
}
type TooltipProps = TooltipStateProps & TooltipOwnProps;

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
    const { getChartContainerRef, tooltipPosition } = this.props;
    const chartContainerRef = getChartContainerRef();

    if (!this.tooltipRef.current || !chartContainerRef.current || !this.portalNode || !tooltipPosition) {
      return;
    }

    const chartContainerBBox = chartContainerRef.current.getBoundingClientRect();
    const tooltipBBox = this.tooltipRef.current.getBoundingClientRect();
    const tooltipStyle = getFinalTooltipPosition(chartContainerBBox, tooltipBBox, tooltipPosition);

    if (tooltipStyle.left) {
      this.portalNode.style.left = tooltipStyle.left;
    }
    if (tooltipStyle.top) {
      this.portalNode.style.top = tooltipStyle.top;
    }
  }

  componentWillUnmount() {
    if (this.portalNode && this.portalNode.parentNode) {
      this.portalNode.parentNode.removeChild(this.portalNode);
    }
  }

  renderHeader(headerData: TooltipValue | null, formatter?: TooltipValueFormatter) {
    if (!headerData) {
      return null;
    }

    return formatter ? formatter(headerData) : headerData.value;
  }

  render() {
    const { isTooltipVisible, tooltip, tooltipHeaderFormatter, isAnnotationTooltipVisible } = this.props;
    if (!this.portalNode) {
      return null;
    }
    const { getChartContainerRef } = this.props;
    const chartContainerRef = getChartContainerRef();
    let tooltipComponent;
    if (chartContainerRef.current === null || !isTooltipVisible || isAnnotationTooltipVisible) {
      return null;
    } else {
      tooltipComponent = (
        <div className="echTooltip" ref={this.tooltipRef}>
          <div className="echTooltip__header">{this.renderHeader(tooltip.header, tooltipHeaderFormatter)}</div>
          <div className="echTooltip__list">
            {tooltip.values.map(({ name, value, color, isHighlighted, seriesKey, yAccessor, isVisible }) => {
              if (!isVisible) {
                return null;
              }
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
    return createPortal(tooltipComponent, this.portalNode);
  }
}

const mapStateToProps = (state: GlobalChartState): TooltipStateProps => {
  if (!isInitialized(state)) {
    return {
      isTooltipVisible: false,
      isAnnotationTooltipVisible: false,
      tooltip: {
        header: null,
        values: [],
      },
      tooltipPosition: null,
      tooltipHeaderFormatter: undefined,
    };
  }
  return {
    isTooltipVisible: isTooltipVisibleSelector(state),
    isAnnotationTooltipVisible: isAnnotationTooltipVisibleSelector(state),
    tooltip: getTooltipValuesSelector(state),
    tooltipPosition: getTooltipPositionSelector(state),
    tooltipHeaderFormatter: getTooltipHeaderFormatterSelector(state),
  };
};

export const Tooltips = connect(mapStateToProps)(TooltipsComponent);
