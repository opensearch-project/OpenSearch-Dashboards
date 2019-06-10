import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { Icon } from '../icons/icon';

import { ChartStore } from '../../state/chart_state';

interface LegendItemProps {
  chartStore?: ChartStore; // FIX until we find a better way on ts mobx
  legendItemKey: string;
  color: string | undefined;
  label: string | undefined;
  isSeriesVisible?: boolean;
  displayValue: string;
  onMouseEnter: (event: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

interface LegendItemState {
  isColorPickerOpen: boolean;
}

class LegendItemComponent extends React.Component<LegendItemProps, LegendItemState> {
  static displayName = 'LegendItem';

  constructor(props: LegendItemProps) {
    super(props);
    this.state = {
      isColorPickerOpen: false,
    };
  }

  closeColorPicker = () => {
    this.setState({
      isColorPickerOpen: false,
    });
  }

  toggleColorPicker = () => {
    this.setState({
      isColorPickerOpen: !this.state.isColorPickerOpen,
    });
  }

  render() {
    const { legendItemKey } = this.props;
    const { color, label, isSeriesVisible, displayValue, onMouseEnter, onMouseLeave } = this.props;

    const onTitleClick = this.onLegendTitleClick(legendItemKey);

    const showLegendDisplayValue = this.props.chartStore!.showLegendDisplayValue.get();
    const isSelected = legendItemKey === this.props.chartStore!.selectedLegendItemKey.get();
    const hasDisplayValue = this.props.chartStore!.showLegendDisplayValue.get();
    const hasTitleClickListener = Boolean(this.props.chartStore!.onLegendItemClickListener);
    return (
      <div className="echLegendItem" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {this.renderColor(this.toggleColorPicker, color)}
        {this.renderVisibilityButton(legendItemKey, isSeriesVisible)}
        {this.renderTitle(label, onTitleClick, hasTitleClickListener, isSelected, hasDisplayValue)}
        {this.renderDisplayValue(displayValue, showLegendDisplayValue, isSeriesVisible)}
      </div>
    );
  }
  renderColor(colorClickAction: () => void, color: string | undefined) {
    if (!color) {
      return null;
    }
    // TODO add color picler
    return (
      <div className="echLegendItem__color">
        <Icon type="dot" aria-label="series color" color={color} onClick={colorClickAction} />
      </div>
    );
  }

  renderVisibilityButton = (legendItemKey: string, isSeriesVisible: boolean = true) => {
    const iconType = isSeriesVisible ? 'eye' : 'eyeClosed';
    return (
      <div className="echLegendItem__visibility">
        <Icon
          type={iconType}
          aria-label="toggle visibility"
          onClick={this.onVisibilityClick(legendItemKey)}
        />
      </div>
    );
  }

  renderTitle(
    title: string | undefined,
    onTitleClick: () => void,
    hasTitleClickListener: boolean,
    isSelected: boolean,
    hasDisplayValue: boolean,
  ) {
    // TODO add contextual menu panel on click
    if (!title) {
      return null;
    }
    const titleClassNames = classNames('echLegendItem__title', {
      ['echLegendItem__title--hasClickListener']: hasTitleClickListener,
      ['echLegendItem__title--selected']: isSelected,
      ['echLegendItem__title--hasDisplayValue']: hasDisplayValue,
    });
    return (
      <div className={titleClassNames} title={title} onClick={onTitleClick}>
        {title}
      </div>
    );
  }

  renderDisplayValue(displayValue: string, show: boolean, isSeriesVisible: boolean | undefined) {
    if (!show) {
      return;
    }
    const displayValueClassNames = classNames('echLegendItem__displayValue', {
      ['echLegendItem__displayValue--hidden']: !isSeriesVisible,
    });
    return (
      <div className={displayValueClassNames} title={displayValue}>
        {displayValue}
      </div>
    );
  }

  onLegendTitleClick = (legendItemKey: string) => () => {
    this.props.chartStore!.onLegendItemClick(legendItemKey);
  }

  // private onLegendItemPanelClose = () => {
  //   // tslint:disable-next-line:no-console
  //   console.log('close');
  // }

  // private onColorPickerChange = (legendItemKey: string) => (color: string) => {
  //   this.props.chartStore!.setSeriesColor(legendItemKey, color);
  // }

  // private renderPlusButton = () => {
  //   return (
  //     <EuiButtonIcon
  //       onClick={this.props.chartStore!.onLegendItemPlusClick}
  //       iconType="plusInCircle"
  //       aria-label="minus"
  //     />
  //   );
  // }

  // private renderMinusButton = () => {
  //   return (
  //     <EuiButtonIcon
  //       onClick={this.props.chartStore!.onLegendItemMinusClick}
  //       iconType="minusInCircle"
  //       aria-label="minus"
  //     />
  //   );
  // }

  private onVisibilityClick = (legendItemKey: string) => (event: React.MouseEvent<SVGElement>) => {
    if (event.shiftKey) {
      this.props.chartStore!.toggleSingleSeries(legendItemKey);
    } else {
      this.props.chartStore!.toggleSeriesVisibility(legendItemKey);
    }
  }
}

export const LegendItem = inject('chartStore')(observer(LegendItemComponent));
