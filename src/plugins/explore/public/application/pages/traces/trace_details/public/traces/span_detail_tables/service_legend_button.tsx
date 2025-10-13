/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiPopover, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';

interface ServiceLegendButtonProps {
  servicesInOrder: string[];
  colorMap: Record<string, string>;
}

export const ServiceLegendButton: React.FC<ServiceLegendButtonProps> = ({
  servicesInOrder,
  colorMap,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  if (servicesInOrder.length === 0) {
    return null;
  }

  const button = (
    <EuiButtonEmpty
      size="xs"
      onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      iconType="inspect"
      data-test-subj="service-legend-toggle"
      isSelected={isPopoverOpen}
    >
      {i18n.translate('explore.traceView.button.serviceLegend', {
        defaultMessage: 'Service legend',
      })}
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      panelPaddingSize="s"
      anchorPosition="downRight"
    >
      <EuiFlexGroup direction="column" gutterSize="s">
        {servicesInOrder.map((service) => (
          <EuiFlexItem grow={false} key={`service-legend-${service}`}>
            <EuiFlexGroup gutterSize="xs" alignItems="center">
              <EuiFlexItem grow={false}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colorMap[service],
                    borderRadius: '2px',
                  }}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s">
                  <span>{service}</span>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </EuiPopover>
  );
};
