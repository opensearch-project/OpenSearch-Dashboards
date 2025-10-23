/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import uuid from 'uuid';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiText,
  EuiIcon,
  EuiButton,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiSpacer,
  EuiModalBody,
  EuiContextMenu,
  EuiPopover,
} from '@elastic/eui';

import { ValueMapping } from '../../types';
import { ColorGroupButton } from '../color_group_panel/color_group_button';
import { ValueMappingItem } from './value_mapping_item';

export interface ValueMappingProps {
  valueMappings?: ValueMapping[];
  onChange: (valueMappings: ValueMapping[]) => void;
}

export const ValueMappingSection = ({ valueMappings, onChange }: ValueMappingProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  const renderMappingItem = (mapping: ValueMapping, index: number) => {
    const handleChangeColor = (color: string | undefined) => {
      const updated = [...(valueMappings ?? [])];
      updated[index] = { ...updated[index], color };
      onChange(updated);
    };
    return (
      <EuiPanel paddingSize="s" color="transparent" key={`${mapping.type}-item-${index}`}>
        <EuiFlexGroup alignItems="center" justifyContent="center" gutterSize="xs">
          <EuiFlexItem>
            {mapping.type === 'value' ? (
              <EuiText textAlign="center">{mapping.value}</EuiText>
            ) : (
              <EuiText textAlign="center">
                {`[${mapping.range?.min}, ${mapping.range?.max ?? '∞'})`}
              </EuiText>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiIcon type={'arrowRight'} />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexItem>
              <EuiText textAlign="center">{mapping.displayText}</EuiText>
            </EuiFlexItem>
          </EuiFlexItem>
          {mapping.color && (
            <EuiFlexItem grow={false}>
              <ColorGroupButton buttonColor={mapping.color} onChange={handleChangeColor} />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    );
  };

  return (
    <>
      {valueMappings?.map((mapping, index) => renderMappingItem(mapping, index))}

      <EuiSpacer size="xs" />
      <EuiButton data-test-subj="valueMappingEditButton" onClick={showModal} fullWidth size="s">
        {i18n.translate('explore.stylePanel.valueMapping.editButton', {
          defaultMessage: 'Edit value mappings',
        })}
      </EuiButton>

      {isModalVisible && (
        <EditValueMappingsModel
          valueMappings={valueMappings}
          onChange={onChange}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export interface ValueMappingModelProps {
  valueMappings?: ValueMapping[];
  onChange: (valueMappings: ValueMapping[]) => void;
  onClose: () => void;
}

export const EditValueMappingsModel = ({
  valueMappings,
  onChange,
  onClose,
}: ValueMappingModelProps) => {
  const [mappings, setMappings] = useState<ValueMapping[]>(valueMappings || []);

  const [isPopoverOpen, setPopover] = useState(false);

  const handleAddMapping = (type: 'value' | 'range') => {
    const newMapping: ValueMapping = {
      id: uuid.v4(),
      type,
      displayText: '',
      ...(type === 'value' ? { value: undefined } : { range: { min: undefined, max: undefined } }),
    };
    const updated = [...mappings, newMapping];
    setMappings(updated);
    setPopover(false);
  };

  const handleDeleteMapping = (index: number) => {
    const updated = mappings.filter((_, i) => i !== index);
    setMappings(updated);
  };

  const handleMappingChange = (index: number, value: ValueMapping) => {
    const updated = [...mappings];
    updated[index] = value;
    setMappings(updated);
  };

  const filterMappings = (value: ValueMapping[]) => {
    const seen = new Set<string>();
    return value.filter((mapping) => {
      // Create unique key for deduplication
      const key =
        mapping.type === 'value'
          ? `value:${mapping.value}`
          : `range:${mapping.range?.min}-${mapping.range?.max}`;

      // Skip duplicates
      if (seen.has(key)) return false;
      seen.add(key);

      // Skip invalid values
      if (mapping.type === 'value' && !mapping.value) return false;

      // Skip invalid ranges
      if (mapping.type === 'range' && mapping.range) {
        const { min, max } = mapping.range;
        if (min === undefined || (max && min >= max)) return false;
      }

      return true;
    });
  };

  const handleSave = () => {
    onChange(filterMappings(mappings));
    onClose();
  };

  return (
    <EuiModal aria-labelledby="editValueMappingsModal" onClose={onClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle id="editValueMappingsModalTitle">
          {i18n.translate('explore.stylePanel.editValueMappingsModal.title', {
            defaultMessage: 'Value mappings',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        {mappings?.map((mapping, index) => {
          return (
            <ValueMappingItem
              key={mapping.id}
              id={index}
              mapping={mapping}
              onDelete={handleDeleteMapping}
              onChange={handleMappingChange}
            />
          );
        })}
        <EuiSpacer />

        <EuiPopover
          id="addNewValueMappingContextMemu"
          button={
            <EuiButton size="s" onClick={() => setPopover(!isPopoverOpen)}>
              {i18n.translate('explore.stylePanel.editValueMappingsModal.add.new.button', {
                defaultMessage: '+ Add new mapping',
              })}
            </EuiButton>
          }
          isOpen={isPopoverOpen}
          closePopover={() => setPopover(false)}
          panelPaddingSize="none"
          anchorPosition="downLeft"
          hasArrow={false}
        >
          <EuiContextMenu
            initialPanelId={0}
            panels={[
              {
                id: 0,
                items: [
                  {
                    name: 'Value',
                    onClick: () => handleAddMapping('value'),
                  },
                  {
                    name: 'Range',
                    onClick: () => handleAddMapping('range'),
                  },
                ],
              },
            ]}
          />
        </EuiPopover>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>
          {i18n.translate('explore.stylePanel.editValueMappingsModal.cancel.button', {
            defaultMessage: 'Cancel',
          })}
        </EuiButtonEmpty>
        <EuiButton fill onClick={handleSave}>
          {i18n.translate('explore.stylePanel.editValueMappingsModal.save.button', {
            defaultMessage: 'Save',
          })}
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
