import classNames from 'classnames';
import React from 'react';
import { deepEqual } from '../../utils/fast_deep_equal';
import { Icon } from '../icons/icon';
import { LegendItemListener, BasicListener } from '../../specs/settings';
import { LegendItem } from '../../chart_types/xy_chart/legend/legend';
import { onLegendItemOutAction, onLegendItemOverAction } from '../../state/actions/legend';
import { Position } from '../../utils/commons';
import { XYChartSeriesIdentifier } from '../../chart_types/xy_chart/utils/series';

interface LegendItemProps {
  legendItem: LegendItem;
  extra: string;
  label?: string;
  legendPosition: Position;
  showExtra: boolean;
  onLegendItemClickListener?: LegendItemListener;
  onLegendItemOutListener?: BasicListener;
  onLegendItemOverListener?: LegendItemListener;
  legendItemOutAction: typeof onLegendItemOutAction;
  legendItemOverAction: typeof onLegendItemOverAction;
  toggleDeselectSeriesAction: (legendItemId: XYChartSeriesIdentifier) => void;
}

/**
 * Create a div for the extra text
 * @param extra
 * @param isSeriesVisible
 */
function renderExtra(extra: string, isSeriesVisible: boolean | undefined) {
  const extraClassNames = classNames('echLegendItem__extra', {
    ['echLegendItem__extra--hidden']: !isSeriesVisible,
  });
  return (
    <div className={extraClassNames} title={extra}>
      {extra}
    </div>
  );
}

/**
 * Create a div for the label
 * @param label
 * @param onLabelClick
 * @param hasLabelClickListener
 */
function renderLabel(
  onLabelClick: (event: React.MouseEvent<Element, MouseEvent>) => void,
  hasLabelClickListener: boolean,
  label?: string,
) {
  if (!label) {
    return null;
  }
  const labelClassNames = classNames('echLegendItem__label', {
    ['echLegendItem__label--hasClickListener']: hasLabelClickListener,
  });
  return (
    <div className={labelClassNames} title={label} onClick={onLabelClick}>
      {label}
    </div>
  );
}

/**
 * Create a div for the color/eye icon
 * @param color
 * @param isSeriesVisible
 */
function renderColor(color?: string, isSeriesVisible = true) {
  if (!color) {
    return null;
  }
  // TODO add color picker
  if (isSeriesVisible) {
    return (
      <div className="echLegendItem__color" aria-label="series color" title="series color">
        <Icon type="dot" color={color} />
      </div>
    );
  }
  // changing the default viewBox for the eyeClosed icon to keep the same dimensions
  return (
    <div className="echLegendItem__color" aria-label="series hidden" title="series hidden">
      <Icon type="eyeClosed" viewBox="-3 -3 22 22" />
    </div>
  );
}

export class LegendListItem extends React.Component<LegendItemProps> {
  static displayName = 'LegendItem';

  shouldComponentUpdate(nextProps: LegendItemProps) {
    return !deepEqual(this.props, nextProps);
  }

  render() {
    const { extra, legendItem, legendPosition, label, showExtra, onLegendItemClickListener } = this.props;
    const { color, isSeriesVisible, seriesIdentifier, isLegendItemVisible } = legendItem;

    const onLabelClick = this.onVisibilityClick(seriesIdentifier);
    const hasLabelClickListener = Boolean(onLegendItemClickListener);

    const itemClassNames = classNames('echLegendItem', `echLegendItem--${legendPosition}`, {
      'echLegendItem-isHidden': !isSeriesVisible,
      'echLegendItem__extra--hidden': !isLegendItemVisible,
    });

    return (
      <div
        className={itemClassNames}
        onMouseEnter={this.onLegendItemMouseOver}
        onMouseLeave={this.onLegendItemMouseOut}
      >
        {renderColor(color, isSeriesVisible)}
        {renderLabel(onLabelClick, hasLabelClickListener, label)}
        {showExtra && renderExtra(extra, isSeriesVisible)}
      </div>
    );
  }

  onLegendItemMouseOver = () => {
    const { onLegendItemOverListener, legendItemOverAction, legendItem } = this.props;
    // call the settings listener directly if available
    if (onLegendItemOverListener) {
      onLegendItemOverListener(legendItem.seriesIdentifier);
    }
    legendItemOverAction(legendItem.key);
  };

  onLegendItemMouseOut = () => {
    const { onLegendItemOutListener, legendItemOutAction } = this.props;
    // call the settings listener directly if available
    if (onLegendItemOutListener) {
      onLegendItemOutListener();
    }
    legendItemOutAction();
  };

  // TODO handle shift key
  onVisibilityClick = (legendItemId: XYChartSeriesIdentifier) => () => {
    const { onLegendItemClickListener, toggleDeselectSeriesAction } = this.props;
    if (onLegendItemClickListener) {
      onLegendItemClickListener(legendItemId);
    }
    toggleDeselectSeriesAction(legendItemId);
  };
}
