/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiPopoverTitle,
  EuiSwitch,
  EuiSpacer,
  EuiText,
  EuiToolTip,
  EuiHorizontalRule,
} from '@elastic/eui';
import { ChartControlsProps } from './types';

/**
 * Chart controls component providing expand functionality and series visibility toggles
 */
export const ChartControls: React.FC<ChartControlsProps> = ({
  onExpand,
  showExpandButton = true,
  series = [],
  onSeriesToggle,
}) => {
  const [isLegendPopoverOpen, setIsLegendPopoverOpen] = useState(false);

  const handleExpandClick = () => {
    if (onExpand) {
      onExpand();
    }
  };

  const handleSeriesToggle = (seriesId: string) => {
    if (onSeriesToggle) {
      onSeriesToggle(seriesId);
    }
  };

  const toggleLegendPopover = () => {
    setIsLegendPopoverOpen(!isLegendPopoverOpen);
  };

  const closeLegendPopover = () => {
    setIsLegendPopoverOpen(false);
  };

  // Check if we have multiple series to show legend controls
  const hasMultipleSeries = series.length > 1;
  const visibleSeriesCount = series.filter((s) => s.visible).length;

  const legendButton = (
    <EuiButtonIcon
      iconType="list"
      onClick={toggleLegendPopover}
      aria-label="Toggle series legend"
      size="s"
      color="text"
      data-test-subj="chart-legend-button"
    />
  );

  const expandButton = showExpandButton ? (
    <EuiToolTip content="Expand chart">
      <EuiButtonIcon
        iconType="fullScreen"
        onClick={handleExpandClick}
        aria-label="Expand chart to full view"
        size="s"
        color="text"
        data-test-subj="chart-expand-button"
      />
    </EuiToolTip>
  ) : null;

  return (
    <EuiFlexGroup
      justifyContent="flexEnd"
      alignItems="center"
      gutterSize="xs"
      responsive={false}
      data-test-subj="chart-controls"
    >
      {hasMultipleSeries && (
        <EuiFlexItem grow={false}>
          <EuiPopover
            button={<EuiToolTip content="Show/hide data series">{legendButton}</EuiToolTip>}
            isOpen={isLegendPopoverOpen}
            closePopover={closeLegendPopover}
            panelPaddingSize="s"
            anchorPosition="downRight"
            data-test-subj="chart-legend-popover"
          >
            <EuiPopoverTitle>
              <EuiText size="s">
                <strong>
                  Data Series ({visibleSeriesCount}/{series.length} visible)
                </strong>
              </EuiText>
            </EuiPopoverTitle>

            <div style={{ minWidth: '200px', maxWidth: '300px' }}>
              {series.map((seriesItem, index) => (
                <div key={seriesItem.id}>
                  <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: seriesItem.color || '#006BB4',
                          borderRadius: '2px',
                          border: '1px solid #D3DAE6',
                        }}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiSwitch
                        label={
                          <EuiText size="s" style={{ maxWidth: '150px' }}>
                            <span title={seriesItem.name}>
                              {seriesItem.name.length > 20
                                ? `${seriesItem.name.substring(0, 20)}...`
                                : seriesItem.name}
                            </span>
                          </EuiText>
                        }
                        checked={seriesItem.visible}
                        onChange={() => handleSeriesToggle(seriesItem.id)}
                        compressed
                        data-test-subj={`series-toggle-${seriesItem.id}`}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  {index < series.length - 1 && <EuiSpacer size="xs" />}
                </div>
              ))}

              {series.length > 1 && (
                <>
                  <EuiHorizontalRule margin="s" />
                  <EuiFlexGroup justifyContent="spaceBetween" gutterSize="s" responsive={false}>
                    <EuiFlexItem>
                      <EuiButtonIcon
                        iconType="eye"
                        onClick={() => {
                          series.forEach((s) => {
                            if (!s.visible) {
                              handleSeriesToggle(s.id);
                            }
                          });
                        }}
                        aria-label="Show all series"
                        size="s"
                        color="text"
                        disabled={visibleSeriesCount === series.length}
                        data-test-subj="show-all-series-button"
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiButtonIcon
                        iconType="eyeClosed"
                        onClick={() => {
                          series.forEach((s) => {
                            if (s.visible && visibleSeriesCount > 1) {
                              handleSeriesToggle(s.id);
                            }
                          });
                        }}
                        aria-label="Hide all series"
                        size="s"
                        color="text"
                        disabled={visibleSeriesCount <= 1}
                        data-test-subj="hide-all-series-button"
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </>
              )}
            </div>
          </EuiPopover>
        </EuiFlexItem>
      )}

      {expandButton && <EuiFlexItem grow={false}>{expandButton}</EuiFlexItem>}
    </EuiFlexGroup>
  );
};
