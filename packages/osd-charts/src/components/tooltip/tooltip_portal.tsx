/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import React from 'react';
import { createPortal } from 'react-dom';
import { connect } from 'react-redux';
import { getFinalTooltipPosition, TooltipAnchorPosition } from './utils';
import { TooltipInfo } from './types';
import { TooltipValueFormatter } from '../../specs';
import { GlobalChartState, BackwardRef } from '../../state/chart_state';
import { getInternalIsTooltipVisibleSelector } from '../../state/selectors/get_internal_is_tooltip_visible';
import { getTooltipHeaderFormatterSelector } from '../../state/selectors/get_tooltip_header_formatter';
import { getInternalTooltipInfoSelector } from '../../state/selectors/get_internal_tooltip_info';
import { getInternalTooltipAnchorPositionSelector } from '../../state/selectors/get_internal_tooltip_anchor_position';
import { Tooltip } from './tooltip';
import { getInternalIsInitializedSelector } from '../../state/selectors/get_internal_is_intialized';

interface TooltipPortalStateProps {
  isVisible: boolean;
  position: TooltipAnchorPosition | null;
  info?: TooltipInfo;
  headerFormatter?: TooltipValueFormatter;
}
interface TooltipPortalOwnProps {
  getChartContainerRef: BackwardRef;
}

type TooltipPortalProps = TooltipPortalStateProps & TooltipPortalOwnProps;

class TooltipPortalComponent extends React.Component<TooltipPortalProps> {
  static displayName = 'Tooltip';
  /**
   * Max allowable width for tooltip to grow to. Used to determine container fit.
   *
   * @unit px
   */
  static MAX_WIDTH = 256;
  portalNode: HTMLDivElement | null = null;
  tooltipRef: React.RefObject<HTMLDivElement>;

  constructor(props: TooltipPortalProps) {
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
      this.portalNode.style.width = `${TooltipPortalComponent.MAX_WIDTH}px`;
      document.body.appendChild(this.portalNode);
    }
  }
  componentDidMount() {
    this.createPortalNode();
  }

  componentDidUpdate() {
    this.createPortalNode();
    const { getChartContainerRef, position } = this.props;
    const chartContainerRef = getChartContainerRef();

    if (!this.tooltipRef.current || !chartContainerRef.current || !this.portalNode || !position) {
      return;
    }

    const chartContainerBBox = chartContainerRef.current.getBoundingClientRect();
    const tooltipBBox = this.tooltipRef.current.getBoundingClientRect();
    const width = Math.min(TooltipPortalComponent.MAX_WIDTH, chartContainerBBox.width * 0.7);
    this.portalNode.style.width = `${width}px`;
    const tooltipStyle = getFinalTooltipPosition(chartContainerBBox, tooltipBBox, width, position);

    if (tooltipStyle.left) {
      this.portalNode.style.left = tooltipStyle.left;
      if (this.tooltipRef.current) {
        this.tooltipRef.current.style.left = tooltipStyle.anchor === 'right' ? 'auto' : '0px';
        this.tooltipRef.current.style.right = tooltipStyle.anchor === 'right' ? '0px' : 'auto';
      }
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

  render() {
    const { isVisible, info, getChartContainerRef } = this.props;
    const chartContainerRef = getChartContainerRef();

    if (!this.portalNode || chartContainerRef.current === null || !isVisible || !info) {
      return null;
    }

    return createPortal(
      <Tooltip info={info} ref={this.tooltipRef} headerFormatter={this.props.headerFormatter} />,
      this.portalNode,
    );
  }
}

const HIDDEN_TOOLTIP_PROPS = {
  isVisible: false,
  info: undefined,
  position: null,
  headerFormatter: undefined,
};

const mapStateToProps = (state: GlobalChartState): TooltipPortalStateProps => {
  if (!getInternalIsInitializedSelector(state)) {
    return HIDDEN_TOOLTIP_PROPS;
  }
  return {
    isVisible: getInternalIsTooltipVisibleSelector(state),
    info: getInternalTooltipInfoSelector(state),
    position: getInternalTooltipAnchorPositionSelector(state),
    headerFormatter: getTooltipHeaderFormatterSelector(state),
  };
};

/** @internal */
export const TooltipPortal = connect(mapStateToProps)(TooltipPortalComponent);
