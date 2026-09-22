/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiButtonIcon,
  EuiColorPicker,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
} from '@elastic/eui';
import { StyleAccordion } from '../style_panel/style_accordion';
import {
  SankeyChartStyle,
  SankeyLevelStyle,
  SankeyLinkColor,
  SankeyNodeAlign,
  SankeyOrientation,
} from './sankey_vis_config';
import { DebouncedFieldNumber, DebouncedFieldRange } from '../style_panel/utils';

interface SankeyExclusiveVisOptionsProps {
  styles: SankeyChartStyle['exclusive'];
  onChange: (styles: SankeyChartStyle['exclusive']) => void;
}

interface SankeyOpacityRangeProps {
  label: string;
  defaultOpacity: number;
  opacity?: number;
  onChange: (opacity: number) => void;
  testSubj: string;
}

const SankeyOpacityRange = ({
  label,
  defaultOpacity,
  opacity,
  onChange,
  testSubj,
}: SankeyOpacityRangeProps) => {
  const defaultOpacityPercent = Math.round(defaultOpacity * 100);
  const opacityPercent = Math.round((opacity ?? defaultOpacity) * 100);

  return (
    <EuiFormRow label={label}>
      <DebouncedFieldRange
        value={opacityPercent}
        onChange={(value) => onChange((value ?? defaultOpacityPercent) / 100)}
        min={0}
        max={100}
        defaultValue={defaultOpacityPercent}
        step={1}
        aria-label={label}
        data-test-subj={testSubj}
      />
    </EuiFormRow>
  );
};

export const SankeyExclusiveVisOptions = ({ styles, onChange }: SankeyExclusiveVisOptionsProps) => {
  const updateStyle = <K extends keyof SankeyChartStyle['exclusive']>(
    key: K,
    value: SankeyChartStyle['exclusive'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  const addLevelStyle = () => {
    const configuredDepths = new Set(styles.levels.map(({ depth }) => depth));
    let depth = 0;
    while (configuredDepths.has(depth)) {
      depth += 1;
    }

    updateStyle('levels', [...styles.levels, { depth, opacity: 1 }]);
  };

  const updateLevelStyle = (index: number, changes: Partial<SankeyLevelStyle>) => {
    updateStyle(
      'levels',
      styles.levels.map((level, levelIndex) =>
        levelIndex === index ? { ...level, ...changes } : level
      )
    );
  };

  const removeLevelStyle = (index: number) => {
    updateStyle(
      'levels',
      styles.levels.filter((_, levelIndex) => levelIndex !== index)
    );
  };

  return (
    <StyleAccordion
      id="sankeySection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.sankey', {
        defaultMessage: 'Sankey',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.sankey.orientation', {
          defaultMessage: 'Orientation',
        })}
      >
        <EuiSelect
          compressed
          options={[
            {
              value: 'horizontal',
              text: i18n.translate('explore.stylePanel.sankey.orientation.horizontal', {
                defaultMessage: 'Horizontal',
              }),
            },
            {
              value: 'vertical',
              text: i18n.translate('explore.stylePanel.sankey.orientation.vertical', {
                defaultMessage: 'Vertical',
              }),
            },
          ]}
          value={styles.orient}
          onChange={(event) => updateStyle('orient', event.target.value as SankeyOrientation)}
          data-test-subj="sankeyOrientation"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.sankey.nodeAlign', {
          defaultMessage: 'Node alignment',
        })}
      >
        <EuiSelect
          compressed
          options={[
            {
              value: 'left',
              text: i18n.translate('explore.stylePanel.sankey.nodeAlign.start', {
                defaultMessage: 'Start',
              }),
            },
            {
              value: 'right',
              text: i18n.translate('explore.stylePanel.sankey.nodeAlign.end', {
                defaultMessage: 'End',
              }),
            },
            {
              value: 'justify',
              text: i18n.translate('explore.stylePanel.sankey.nodeAlign.justify', {
                defaultMessage: 'Justify',
              }),
            },
          ]}
          value={styles.nodeAlign}
          onChange={(event) => updateStyle('nodeAlign', event.target.value as SankeyNodeAlign)}
          data-test-subj="sankeyNodeAlign"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.sankey.nodeWidth', {
          defaultMessage: 'Node width',
        })}
      >
        <DebouncedFieldNumber
          value={styles.nodeWidth}
          min={1}
          defaultValue={20}
          onChange={(nodeWidth) => updateStyle('nodeWidth', nodeWidth ?? 20)}
          append={i18n.translate('explore.stylePanel.sankey.pixels', {
            defaultMessage: 'px',
          })}
          data-test-subj="sankeyNodeWidth"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.sankey.nodeGap', {
          defaultMessage: 'Node gap',
        })}
      >
        <DebouncedFieldNumber
          value={styles.nodeGap}
          min={0}
          defaultValue={8}
          onChange={(nodeGap) => updateStyle('nodeGap', nodeGap ?? 8)}
          append={i18n.translate('explore.stylePanel.sankey.pixels', {
            defaultMessage: 'px',
          })}
          data-test-subj="sankeyNodeGap"
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.stylePanel.sankey.showNodeLabels', {
            defaultMessage: 'Show node labels',
          })}
          checked={styles.showNodeLabels}
          onChange={(event) => updateStyle('showNodeLabels', event.target.checked)}
          data-test-subj="sankeyShowNodeLabels"
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.stylePanel.sankey.showLinkValues', {
            defaultMessage: 'Show link values',
          })}
          checked={styles.showLinkLabels}
          onChange={(event) => updateStyle('showLinkLabels', event.target.checked)}
          data-test-subj="sankeyShowLinkValues"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.sankey.linkColor', {
          defaultMessage: 'Link color',
        })}
      >
        <EuiSelect
          compressed
          options={[
            {
              value: 'source',
              text: i18n.translate('explore.stylePanel.sankey.linkColor.source', {
                defaultMessage: 'Source',
              }),
            },
            {
              value: 'target',
              text: i18n.translate('explore.stylePanel.sankey.linkColor.target', {
                defaultMessage: 'Target',
              }),
            },
            {
              value: 'gradient',
              text: i18n.translate('explore.stylePanel.sankey.linkColor.gradient', {
                defaultMessage: 'Gradient',
              }),
            },
          ]}
          value={styles.linkColor}
          onChange={(event) => updateStyle('linkColor', event.target.value as SankeyLinkColor)}
          data-test-subj="sankeyLinkColor"
        />
      </EuiFormRow>

      <SankeyOpacityRange
        label={i18n.translate('explore.stylePanel.sankey.linkOpacity', {
          defaultMessage: 'Link opacity',
        })}
        defaultOpacity={0.4}
        opacity={styles.linkOpacity}
        onChange={(linkOpacity) => updateStyle('linkOpacity', linkOpacity)}
        testSubj="sankeyLinkOpacity"
      />

      {styles.levels.map((level, index) => (
        <React.Fragment key={`${level.depth}-${index}`}>
          <EuiSpacer size="s" />
          <EuiPanel paddingSize="s" hasShadow={false} hasBorder>
            <EuiFlexGroup gutterSize="s" alignItems="flexStart">
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate('explore.stylePanel.sankey.level', {
                    defaultMessage: 'Level',
                  })}
                >
                  <DebouncedFieldNumber
                    value={level.depth}
                    min={0}
                    defaultValue={0}
                    onChange={(depth) => updateLevelStyle(index, { depth: depth ?? 0 })}
                    data-test-subj={`sankeyLevelDepth-${index}`}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate('explore.stylePanel.sankey.levelColor', {
                    defaultMessage: 'Node color',
                  })}
                >
                  <EuiColorPicker
                    compressed
                    color={level.color ?? ''}
                    onChange={(color) => updateLevelStyle(index, { color: color || undefined })}
                    data-test-subj={`sankeyLevelColor-${index}`}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="trash"
                  color="danger"
                  aria-label={i18n.translate('explore.stylePanel.sankey.removeLevelStyle', {
                    defaultMessage: 'Remove level {depth}',
                    values: { depth: level.depth },
                  })}
                  onClick={() => removeLevelStyle(index)}
                  data-test-subj={`sankeyRemoveLevelStyle-${index}`}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <SankeyOpacityRange
              label={i18n.translate('explore.stylePanel.sankey.levelOpacity', {
                defaultMessage: 'Node opacity',
              })}
              defaultOpacity={1}
              opacity={level.opacity}
              onChange={(opacity) => updateLevelStyle(index, { opacity })}
              testSubj={`sankeyLevelOpacity-${index}`}
            />
          </EuiPanel>
        </React.Fragment>
      ))}

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.sankey.levelStyles', {
          defaultMessage: 'Level styles',
        })}
      >
        <EuiButton
          size="s"
          iconType="plusInCircle"
          onClick={addLevelStyle}
          data-test-subj="sankeyAddLevelStyle"
        >
          {i18n.translate('explore.stylePanel.sankey.addLevelStyle', {
            defaultMessage: 'Add level style',
          })}
        </EuiButton>
      </EuiFormRow>
    </StyleAccordion>
  );
};
