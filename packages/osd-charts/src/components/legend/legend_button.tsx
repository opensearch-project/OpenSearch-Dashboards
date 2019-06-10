import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { ChartStore } from '../../state/chart_state';
import { Icon } from '../icons/icon';

interface LegendButtonProps {
  chartStore?: ChartStore;
  legendId: string;
}

class LegendButtonComponent extends React.Component<LegendButtonProps> {
  static displayName = 'Legend';
  onCollapseLegend = () => {
    this.props.chartStore!.toggleLegendCollapsed();
  }

  render() {
    const { initialized, legendItems, legendCollapsed, showLegend } = this.props.chartStore!;

    if (!showLegend.get() || !initialized.get() || legendItems.size === 0) {
      return null;
    }
    const isOpen = !legendCollapsed.get();
    const className = classNames('echLegendButton', {
      'echLegendButton--isOpen': isOpen,
    });
    return (
      <button
        type="button"
        onClick={this.onCollapseLegend}
        className={className}
        aria-expanded={!legendCollapsed.get()}
        aria-label={legendCollapsed.get() ? 'Expand legend' : 'Collapse legend'}
        title={legendCollapsed.get() ? 'Expand legend' : 'Collapse legend'}
        aria-controls={this.props.legendId}
      >
        <Icon type="list" />
      </button>
    );
  }
}

export const LegendButton = inject('chartStore')(observer(LegendButtonComponent));
