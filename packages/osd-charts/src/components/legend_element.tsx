import {
  EuiButtonIcon,
  // TODO: remove ts-ignore below once typings file is included in eui for color picker
  // @ts-ignore
  EuiColorPicker,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import React from 'react';

import { ChartStore } from '../state/chart_state';

interface LegendElementProps {
  chartStore?: ChartStore; // FIX until we find a better way on ts mobx
  legendItemKey: string;
  color: string | undefined;
  label: string | undefined;
  isSeriesVisible?: boolean;
}

interface LegendElementState {
  isColorPickerOpen: boolean;
}

class LegendElementComponent extends React.Component<LegendElementProps, LegendElementState> {
  static displayName = 'LegendElement';

  constructor(props: LegendElementProps) {
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
    const { color, label, isSeriesVisible } = this.props;

    const onTitleClick = this.onLegendTitleClick(legendItemKey);

    const isSelected = legendItemKey === this.props.chartStore!.selectedLegendItemKey.get();
    const titleClassNames = classNames(
      {
        ['elasticChartsLegendListItem__title--selected']: isSelected,
      },
      'elasticChartsLegendListItem__title',
    );

    const colorDotProps = {
      color,
      onClick: this.toggleColorPicker,
    };

    const colorDot = <EuiIcon type="dot" {...colorDotProps} />;

    return (
      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiPopover
            id="legendItemColorPicker"
            button={colorDot}
            isOpen={this.state.isColorPickerOpen}
            closePopover={this.closeColorPicker}
            panelPaddingSize="s"
            anchorPosition="downCenter"
          >
            <EuiContextMenuPanel>
              <EuiColorPicker onChange={this.onColorPickerChange(legendItemKey)} color={color} />
            </EuiContextMenuPanel>
          </EuiPopover>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {this.renderVisibilityButton(legendItemKey, isSeriesVisible)}
        </EuiFlexItem>
        <EuiFlexItem grow={false} className={titleClassNames} onClick={onTitleClick}>
          <EuiPopover
            id="contentPanel"
            button={
              <EuiText size="xs" className="eui-textTruncate elasticChartsLegendListItem__title">
                {label}
              </EuiText>
            }
            isOpen={isSelected}
            closePopover={this.onLegendItemPanelClose}
            panelPaddingSize="s"
            anchorPosition="downCenter"
          >
            <EuiContextMenuPanel>
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                <EuiFlexItem>{this.renderPlusButton()}</EuiFlexItem>
                <EuiFlexItem>{this.renderMinusButton()}</EuiFlexItem>
              </EuiFlexGroup>
            </EuiContextMenuPanel>
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  private onLegendTitleClick = (legendItemKey: string) => () => {
    this.props.chartStore!.onLegendItemClick(legendItemKey);
  }

  private onLegendItemPanelClose = () => {
    // tslint:disable-next-line:no-console
    console.log('close');
  }

  private onColorPickerChange = (legendItemKey: string) => (color: string) => {
    this.props.chartStore!.setSeriesColor(legendItemKey, color);
  }

  private renderPlusButton = () => {
    return (
      <EuiButtonIcon
        onClick={this.props.chartStore!.onLegendItemPlusClick}
        iconType="plusInCircle"
        aria-label="minus"
      />
    );
  }

  private renderMinusButton = () => {
    return (
      <EuiButtonIcon
        onClick={this.props.chartStore!.onLegendItemMinusClick}
        iconType="minusInCircle"
        aria-label="minus"
      />
    );
  }

  private onVisibilityClick = (legendItemKey: string) => (event: React.MouseEvent<HTMLElement>) => {
    if (event.shiftKey) {
      this.props.chartStore!.toggleSingleSeries(legendItemKey);
    } else {
      this.props.chartStore!.toggleSeriesVisibility(legendItemKey);
    }
  }

  private renderVisibilityButton = (legendItemKey: string, isSeriesVisible: boolean = true) => {
    const iconType = isSeriesVisible ? 'eye' : 'eyeClosed';
    return (
      <EuiButtonIcon
        onClick={this.onVisibilityClick(legendItemKey)}
        iconType={iconType}
        aria-label="toggle visibility"
      />
    );
  }
}

export const LegendElement = inject('chartStore')(observer(LegendElementComponent));
