/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Integrate with saved queries service and update with real saved queries in list and  modify ui too.
// This component will be fully functional once integrated with query services.
import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
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
        i18n.translate('explore.queryPanel.saveQueryButton.nameRequiredError', {
          defaultMessage:
            'Name is required. Name cannot contain leading or trailing whitespace. Name must be unique.',
        })
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
            className="queryPanel__footer__saveQueryButton"
            data-test-subj="queryPanelFootersaveQueryButton"
          >
            {i18n.translate('explore.queryPanel.saveQueryButton.savedQueries', {
              defaultMessage: 'Saved Queries',
            })}
            <EuiIcon type="arrowDown" className="queryPanel__footer__saveQueryButtonIcon" />
          </EuiButtonEmpty>
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="downCenter"
      >
        <EuiPopoverTitle>
          {i18n.translate('explore.queryPanel.saveQueryButton.popoverTitle', {
            defaultMessage: 'SAVED QUERIES',
          })}
        </EuiPopoverTitle>
        <div className="queryPanel__footer__popoverBody" data-test-subj="saveQueryPopoverBody">
          <EuiText size="s" className="queryPanel__footer__popoverText">
            <p>
              {i18n.translate('explore.queryPanel.saveQueryButton.popoverBody', {
                defaultMessage:
                  'There are no saved queries. Save query text and filters that you want to use again.',
              })}
            </p>
          </EuiText>
        </div>
        <EuiPopoverFooter>
          <div className="queryPanel__footer__popoverFooter">
            <EuiButton size="s" onClick={openModal} fill>
              {i18n.translate('explore.queryPanel.saveQueryButton.saveCurrentQuery', {
                defaultMessage: 'Save current query',
              })}
            </EuiButton>
          </div>
        </EuiPopoverFooter>
      </EuiPopover>

      {isModalOpen && (
        <EuiModal onClose={closeModal} className="queryPanel__footer__modal">
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              {i18n.translate('explore.queryPanel.saveQueryButton.modalTitle', {
                defaultMessage: 'Save query',
              })}
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiText size="s" className="queryPanel__footer__modalText">
              <p>
                {i18n.translate('explore.queryPanel.saveQueryButton.modalBody', {
                  defaultMessage:
                    'There are no saved queries. Save query text and filters that you want to use again.',
                })}
              </p>
            </EuiText>
            <EuiForm>
              <EuiFormRow
                label={i18n.translate('explore.queryPanel.saveQueryButton.nameLabel', {
                  defaultMessage: 'Name',
                })}
                isInvalid={!!error}
                error={error}
              >
                <EuiFieldText
                  placeholder={i18n.translate(
                    'explore.queryPanel.saveQueryButton.namePlaceholder',
                    {
                      defaultMessage: 'Enter query name',
                    }
                  )}
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  isInvalid={!!error}
                />
              </EuiFormRow>
              <EuiText size="s" className="queryPanel__footer__modalTextSecondary">
                <p>
                  {i18n.translate('explore.queryPanel.saveQueryButton.modalBodyNameRequired', {
                    defaultMessage:
                      'Name is required. Name cannot contain leading or trailing whitespace. Name must be unique.',
                  })}
                </p>
              </EuiText>

              <EuiFormRow
                label={i18n.translate('explore.queryPanel.saveQueryButton.descriptionLabel', {
                  defaultMessage: 'Description',
                })}
              >
                <EuiFieldText
                  placeholder={i18n.translate(
                    'explore.queryPanel.saveQueryButton.descriptionPlaceholder',
                    { defaultMessage: 'Enter query description' }
                  )}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </EuiFormRow>

              <EuiFormRow>
                <EuiSwitch
                  label={i18n.translate(
                    'explore.queryPanel.saveQueryButton.includeTimeFilterLabel',
                    { defaultMessage: 'Include time filter' }
                  )}
                  checked={includeTimeFilter}
                  onChange={(e) => setIncludeTimeFilter(e.target.checked)}
                />
              </EuiFormRow>
            </EuiForm>
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButton onClick={closeModal} color="text">
              {i18n.translate('explore.queryPanel.saveQueryButton.save', {
                defaultMessage: 'Save',
              })}
            </EuiButton>
            <EuiButton onClick={handleSave} fill>
              {i18n.translate('explore.queryPanel.saveQueryButton.save', {
                defaultMessage: 'Save',
              })}
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
    </>
  );
};
