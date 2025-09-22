/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiTabbedContent,
  EuiContextMenu,
  EuiText,
  EuiColorPicker,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import { getColorGroups, greyDefault } from '../../../visualizations/theme/default_colors';
import { useDebouncedValue } from '../../utils/use_debounced_value';
import './color_group_panel.scss';

interface ColorGroupPanelProps {
  color?: string;
  onChange: (color?: string) => void;
  onClose: () => void;
}
export const ColorGroupPanel: React.FC<ColorGroupPanelProps> = ({ color, onChange, onClose }) => {
  const colors = getColorGroups();

  const [debouncedColor, setDebouncedColor] = useDebouncedValue<string | undefined>(
    color,
    (val) => onChange(val),
    100
  );

  const renderColorGroup = (groupName: string, group: Record<string, string>) => {
    return (
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiText size="s">{groupName}</EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup alignItems="center" gutterSize="s" justifyContent="flexEnd">
            {Object.entries(group).map(([key, value]) => (
              <EuiFlexItem grow={false} key={key}>
                <button
                  className="colorCircle"
                  style={{ backgroundColor: value }}
                  onClick={() => {
                    onChange(value);
                    onClose();
                  }}
                />
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const renderAllColorGroups = () => {
    return Object.entries(colors).map(([groupName, group]) => (
      <div key={groupName}>{renderColorGroup(groupName, group)} </div>
    ));
  };

  const tabs = [
    {
      id: 'colorGroup',
      name: i18n.translate('explore.stylePanel.colorGroupPanel.colorGroup', {
        defaultMessage: 'Colors',
      }),
      content: (
        <EuiPanel paddingSize="s" hasBorder={false} hasShadow={false}>
          {renderAllColorGroups()}
          <EuiSpacer size="m" />
          <EuiFlexGrid columns={2}>
            {[
              {
                label: 'Transparent',
                circleColor: 'transparent',
              },
              { label: 'Text Color', circleColor: greyDefault },
            ].map(({ label, circleColor }) => (
              <EuiFlexItem key={label}>
                <EuiFlexGroup alignItems="center" gutterSize="s" justifyContent="center">
                  <EuiFlexItem grow={false}>
                    <EuiText size="xs" color="subdued">
                      {label}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <button
                      className="colorCircle"
                      style={{ backgroundColor: circleColor }}
                      onClick={() => {
                        onChange(circleColor);
                        onClose();
                      }}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            ))}
          </EuiFlexGrid>
        </EuiPanel>
      ),
    },
    {
      id: 'customColor',
      name: i18n.translate('explore.stylePanel.colorGroupPanel.customColor', {
        defaultMessage: 'Custom',
      }),
      content: (
        <EuiPanel paddingSize="s" hasBorder={false} hasShadow={false}>
          <EuiColorPicker
            compressed
            onChange={(val) => {
              setDebouncedColor(val);
              onClose();
            }}
            color={debouncedColor}
            display="inline"
          />
        </EuiPanel>
      ),
    },
  ];

  const panels = [
    {
      id: 0,
      content: (
        <EuiTabbedContent initialSelectedTab={tabs[0]} size="s" autoFocus="selected" tabs={tabs} />
      ),
    },
  ];

  return <EuiContextMenu initialPanelId={0} panels={panels} />;
};
