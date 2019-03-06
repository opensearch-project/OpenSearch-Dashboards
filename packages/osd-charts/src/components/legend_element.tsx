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
  index: number;
  color: string | undefined;
  label: string | undefined;
  isVisible?: boolean;
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
    const legendItemIndex = this.props.index;
    const { color, label, isVisible } = this.props;

    const onTitleClick = this.onLegendTitleClick(legendItemIndex);

    const isSelected = legendItemIndex === this.props.chartStore!.selectedLegendItemIndex.get();
    const titleClassNames = classNames({
      ['elasticChartsLegendListItem__title--selected']: isSelected,
    }, 'elasticChartsLegendListItem__title');

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
              <EuiColorPicker onChange={this.onColorPickerChange(legendItemIndex)} color={color} />
            </EuiContextMenuPanel>
          </EuiPopover>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {this.renderVisibilityButton(legendItemIndex, isVisible)}
        </EuiFlexItem>
        <EuiFlexItem grow={false} className={titleClassNames} onClick={onTitleClick}>
          <EuiPopover
            id="contentPanel"
            button={(<EuiText size="xs" className="eui-textTruncate elasticChartsLegendListItem__title">
              {label}
            </EuiText>)
            }
            isOpen={isSelected}
            closePopover={this.onLegendItemPanelClose}
            panelPaddingSize="s"
            anchorPosition="downCenter"
          >
            <EuiContextMenuPanel>
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                <EuiFlexItem>
                  {this.renderPlusButton()}
                </EuiFlexItem>
                <EuiFlexItem>
                  {this.renderMinusButton()}
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiContextMenuPanel>
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  private onLegendTitleClick = (legendItemIndex: number) => () => {
    this.props.chartStore!.onLegendItemClick(legendItemIndex);
  }

  private onLegendItemPanelClose = () => {
    // tslint:disable-next-line:no-console
    console.log('close');
  }

  private onColorPickerChange = (legendItemIndex: number) => (color: string) => {
    this.props.chartStore!.setSeriesColor(legendItemIndex, color);
  }

  private renderPlusButton = () => {
    return (
      <EuiButtonIcon
        onClick={this.props.chartStore!.onLegendItemPlusClick}
        iconType="plusInCircle"
        aria-label="minus"
      />);
  }

  private renderMinusButton = () => {
    return (
      <EuiButtonIcon
        onClick={this.props.chartStore!.onLegendItemMinusClick}
        iconType="minusInCircle"
        aria-label="minus"
      />);
  }

  private onVisibilityClick = (legendItemIndex: number) => (event: React.MouseEvent<HTMLElement>) => {
    if (event.shiftKey) {
      this.props.chartStore!.toggleSingleSeries(legendItemIndex);
    } else {
      this.props.chartStore!.toggleSeriesVisibility(legendItemIndex);
    }
  }

  private renderVisibilityButton = (legendItemIndex: number, isVisible: boolean = true) => {
    const iconType = isVisible ? 'eye' : 'eyeClosed';

    return <EuiButtonIcon
      onClick={this.onVisibilityClick(legendItemIndex)}
      iconType={iconType}
      aria-label="toggle visibility"
    />;
  }
}

export const LegendElement = inject('chartStore')(observer(LegendElementComponent));
