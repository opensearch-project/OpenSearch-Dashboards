/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Integrate with saved queries service and update with real saved queries in list and  modify ui too.
// This component will be fully functional once integrated with query services.
import React, { useState } from 'react';
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiText,
  EuiIcon,
  EuiPopoverTitle,
  EuiPopoverFooter,
  EuiButton,
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeaderTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSwitch,
} from '@elastic/eui';

export const SaveQueryButton: React.FC = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [description, setDescription] = useState('');
  const [includeTimeFilter, setIncludeTimeFilter] = useState(false);
  const [error, setError] = useState('');

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const openModal = () => {
    setIsModalOpen(true);
    closePopover();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(''); // Clear error on modal close
  };

  const handleSave = () => {
    if (!queryName.trim()) {
      setError(
        'Name is required. Name cannot contain leading or trailing whitespace. Name must be unique.'
      );
      return;
    }
    closeModal();
  };

  return (
    <>
      <EuiPopover
        button={
          <EuiButtonEmpty
            onClick={onButtonClick}
            iconType="save"
            style={{ color: '#0073e6', padding: '0px' }}
            data-test-subj="saveQueryButton"
          >
            Saved Queries
            <EuiIcon type="arrowDown" style={{ marginLeft: '5px' }} />
          </EuiButtonEmpty>
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="downCenter"
      >
        <EuiPopoverTitle>SAVED QUERIES</EuiPopoverTitle>
        <div style={{ padding: '10px' }} data-test-subj="saveQueryPopoverBody">
          <EuiText size="s" style={{ color: '#676E75', maxWidth: '500px' }}>
            <p>
              There are no saved queries. Save query text and filters that you want to use again.
            </p>
          </EuiText>
        </div>
        <EuiPopoverFooter>
          <div style={{ textAlign: 'right' }}>
            <EuiButton size="s" onClick={openModal} fill>
              Save current query
            </EuiButton>
          </div>
        </EuiPopoverFooter>
      </EuiPopover>

      {isModalOpen && (
        <EuiModal onClose={closeModal} style={{ width: '500px' }}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>Save query</EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiText size="s" style={{ marginBottom: '15px', color: '#676E75' }}>
              <p>
                There are no saved queries. Save query text and filters that you want to use again.
              </p>
            </EuiText>
            <EuiForm>
              {/* Name Field */}
              <EuiFormRow label="Name" isInvalid={!!error} error={error}>
                <EuiFieldText
                  placeholder="Enter query name"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  isInvalid={!!error}
                />
              </EuiFormRow>
              <EuiText size="s" style={{ margin: '15px 0', color: '#676E75' }}>
                <p>
                  There are no saved queries. Save query text and filters that you want to use
                  again.
                </p>
              </EuiText>

              <EuiFormRow label="Description">
                <EuiFieldText
                  placeholder="Enter query description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </EuiFormRow>

              <EuiFormRow>
                <EuiSwitch
                  label="Include time filter"
                  checked={includeTimeFilter}
                  onChange={(e) => setIncludeTimeFilter(e.target.checked)}
                />
              </EuiFormRow>
            </EuiForm>
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButton onClick={closeModal} color="text">
              Cancel
            </EuiButton>
            <EuiButton onClick={handleSave} fill>
              Save
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
    </>
  );
};
