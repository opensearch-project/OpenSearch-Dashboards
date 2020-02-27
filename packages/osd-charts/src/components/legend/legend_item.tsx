import classNames from 'classnames';
import React, { Component, createRef } from 'react';
import { deepEqual } from '../../utils/fast_deep_equal';
import { Icon } from '../icons/icon';
import { LegendItemListener, BasicListener, LegendColorPicker } from '../../specs/settings';
import { LegendItem } from '../../chart_types/xy_chart/legend/legend';
import { onLegendItemOutAction, onLegendItemOverAction } from '../../state/actions/legend';
import { Position, Color } from '../../utils/commons';
import { XYChartSeriesIdentifier } from '../../chart_types/xy_chart/utils/series';
import { clearTemporaryColors, setTemporaryColor, setPersistedColor } from '../../state/actions/colors';

interface LegendItemProps {
  legendItem: LegendItem;
  extra: string;
  label?: string;
  legendPosition: Position;
  showExtra: boolean;
  legendColorPicker?: LegendColorPicker;
  onLegendItemClickListener?: LegendItemListener;
  onLegendItemOutListener?: BasicListener;
  onLegendItemOverListener?: LegendItemListener;
  legendItemOutAction: typeof onLegendItemOutAction;
  legendItemOverAction: typeof onLegendItemOverAction;
  clearTemporaryColors: typeof clearTemporaryColors;
  setTemporaryColor: typeof setTemporaryColor;
  setPersistedColor: typeof setPersistedColor;
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

interface LegendItemState {
  isOpen: boolean;
}

export class LegendListItem extends Component<LegendItemProps, LegendItemState> {
  static displayName = 'LegendItem';
  ref = createRef<HTMLDivElement>();

  state: LegendItemState = {
    isOpen: false,
  };

  shouldComponentUpdate(nextProps: LegendItemProps, nextState: LegendItemState) {
    return !deepEqual(this.props, nextProps) || !deepEqual(this.state, nextState);
  }

  handleColorClick = (changable: boolean) =>
    changable
      ? (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          event.stopPropagation();
          this.toggleIsOpen();
        }
      : undefined;

  /**
   * Create a div for the color/eye icon
   * @param color
   * @param isSeriesVisible
   */
  renderColor = (color?: string, isSeriesVisible = true) => {
    if (!color) {
      return null;
    }

    if (!isSeriesVisible) {
      return (
        <div className="echLegendItem__color" aria-label="series hidden" title="series hidden">
          {/* changing the default viewBox for the eyeClosed icon to keep the same dimensions */}
          <Icon type="eyeClosed" viewBox="-3 -3 22 22" />
        </div>
      );
    }

    const changable = Boolean(this.props.legendColorPicker);
    const colorClasses = classNames('echLegendItem__color', {
      'echLegendItem__color--changable': changable,
    });

    return (
      <div
        onClick={this.handleColorClick(changable)}
        className={colorClasses}
        aria-label="series color"
        title="series color"
      >
        <Icon type="dot" color={color} />
      </div>
    );
  };

  renderColorPicker() {
    const {
      legendColorPicker: ColorPicker,
      legendItem,
      clearTemporaryColors,
      setTemporaryColor,
      setPersistedColor,
    } = this.props;
    const { seriesIdentifier, color } = legendItem;

    const handleClose = () => {
      setPersistedColor(seriesIdentifier.key, color);
      clearTemporaryColors();
      this.toggleIsOpen();
    };

    if (ColorPicker && this.state.isOpen && this.ref.current) {
      return (
        <ColorPicker
          anchor={this.ref.current}
          color={color}
          onClose={handleClose}
          onChange={(color: Color) => setTemporaryColor(seriesIdentifier.key, color)}
          seriesIdentifier={seriesIdentifier}
        />
      );
    }
  }

  render() {
    const { extra, legendItem, legendPosition, label, showExtra, onLegendItemClickListener } = this.props;
    const { color, isSeriesVisible, seriesIdentifier, isLegendItemVisible } = legendItem;
    const onLabelClick = this.onVisibilityClick(seriesIdentifier);
    const hasLabelClickListener = Boolean(onLegendItemClickListener);

    const itemClassNames = classNames('echLegendItem', `echLegendItem--${legendPosition}`, {
      'echLegendItem--hidden': !isSeriesVisible,
      'echLegendItem__extra--hidden': !isLegendItemVisible,
    });

    return (
      <>
        <div
          ref={this.ref}
          className={itemClassNames}
          onMouseEnter={this.onLegendItemMouseOver}
          onMouseLeave={this.onLegendItemMouseOut}
        >
          {this.renderColor(color, isSeriesVisible)}
          {renderLabel(onLabelClick, hasLabelClickListener, label)}
          {showExtra && renderExtra(extra, isSeriesVisible)}
        </div>
        {this.renderColorPicker()}
      </>
    );
  }

  toggleIsOpen = () => {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  };

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
