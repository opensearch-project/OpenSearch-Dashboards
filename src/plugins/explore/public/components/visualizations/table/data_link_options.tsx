/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiButtonIcon,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiSwitch,
  EuiText,
} from '@elastic/eui';
import { StyleAccordion } from '../style_panel/style_accordion';
import { TableVisStyleControlsProps } from './table_vis_options';
import { VisColumn } from '../types';
import { DebouncedFieldText } from '../style_panel/utils';

export interface DataLink {
  id: string;
  title: string;
  url: string;
  openInNewTab: boolean;
  fields: string[];
}

interface DataLinkModalProps {
  link?: DataLink;
  onSave: (link: DataLink) => void;
  onCancel: () => void;
  availableFields: Array<{ label: string; value: string }>;
}

const DataLinkModal: React.FC<DataLinkModalProps> = ({
  link,
  onSave,
  onCancel,
  availableFields,
}) => {
  const [title, setTitle] = useState(link?.title || '');
  const [url, setUrl] = useState(link?.url || '');
  const [openInNewTab, setOpenInNewTab] = useState(link?.openInNewTab || false);
  const [selectedFields, setSelectedFields] = useState<Array<{ label: string; value: string }>>(
    link?.fields
      .map((field) => {
        const fieldOption = availableFields.find((option) => option.value === field);
        return fieldOption ? { label: fieldOption.label, value: fieldOption.value } : null;
      })
      .filter((option): option is { label: string; value: string } => option !== null) || []
  );

  const isSaveDisabled = !title.trim() || !url.trim() || selectedFields.length === 0;

  const handleSave = () => {
    onSave({
      id: link?.id || Math.random().toString(36).substr(2, 9),
      title,
      url,
      openInNewTab,
      fields: selectedFields.map((option) => option.value),
    });
  };

  const handleFieldsChange = (selected: Array<EuiComboBoxOptionOption<string>>) => {
    const validSelected = selected
      .filter((option): option is { label: string; value: string } => option.value !== undefined)
      .map((option) => ({ label: option.label, value: option.value! }));
    setSelectedFields(validSelected);
  };

  return (
    <EuiModal onClose={onCancel}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {link
            ? i18n.translate('explore.stylePanel.table.dataLinks.editModalTitle', {
                defaultMessage: 'Edit Link',
              })
            : i18n.translate('explore.stylePanel.table.dataLinks.addModalTitle', {
                defaultMessage: 'Add Link',
              })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.table.dataLinks.titleLabel', {
            defaultMessage: 'Title',
          })}
        >
          <DebouncedFieldText
            value={title}
            placeholder="Enter data link title"
            onChange={(value: string) => setTitle(value)}
            data-test-subj="dataLinkTitleInput"
          />
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.table.dataLinks.fieldsLabel', {
            defaultMessage: 'Fields',
          })}
        >
          <EuiComboBox
            placeholder="Select fields"
            options={availableFields}
            selectedOptions={selectedFields}
            onChange={handleFieldsChange}
            isClearable={true}
            data-test-subj="dataLinkFieldsComboBox"
          />
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.table.dataLinks.urlLabel', {
            defaultMessage: 'URL',
          })}
          helpText={i18n.translate('explore.stylePanel.table.dataLinks.urlHelpText', {
            defaultMessage: 'Use {cellValue} to include the cell value in the URL',
            values: {
              cellValue: '${__value.text}',
            },
          })}
        >
          <DebouncedFieldText
            value={url}
            placeholder="Enter data link url"
            onChange={(value: string) => setUrl(value)}
            data-test-subj="dataLinkUrlInput"
          />
        </EuiFormRow>
        <EuiFormRow>
          <EuiSwitch
            compressed
            label={i18n.translate('explore.stylePanel.table.dataLinks.openInNewTabLabel', {
              defaultMessage: 'Open in new tab',
            })}
            checked={openInNewTab}
            onChange={(e) => setOpenInNewTab(e.target.checked)}
            data-test-subj="dataLinkNewTabSwitch"
          />
        </EuiFormRow>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiSmallButtonEmpty onClick={onCancel}>
          {i18n.translate('explore.stylePanel.table.dataLinks.cancelButton', {
            defaultMessage: 'Cancel',
          })}
        </EuiSmallButtonEmpty>
        <EuiSmallButton
          onClick={handleSave}
          fill
          disabled={isSaveDisabled}
          data-test-subj="dataLinkSaveButton"
        >
          {i18n.translate('explore.stylePanel.table.dataLinks.saveButton', {
            defaultMessage: 'Save',
          })}
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};

export const DataLinkOptions: React.FC<TableVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DataLink | undefined>(undefined);

  const availableFields = [
    ...numericalColumns.map((col: VisColumn) => ({
      label: col.name || col.column,
      value: col.column,
    })),
    ...categoricalColumns.map((col: VisColumn) => ({
      label: col.name || col.column,
      value: col.column,
    })),
    ...dateColumns.map((col: VisColumn) => ({ label: col.name || col.column, value: col.column })),
  ];

  const addOrUpdateLink = useCallback(
    (link: DataLink) => {
      const currentLinks = styleOptions.dataLinks || [];
      const updatedLinks = editingLink
        ? currentLinks.map((l) => (l.id === link.id ? link : l))
        : [...currentLinks, link];
      onStyleChange({ dataLinks: updatedLinks });
      setIsModalOpen(false);
      setEditingLink(undefined);
    },
    [styleOptions.dataLinks, onStyleChange, editingLink]
  );

  const deleteLink = useCallback(
    (id: string) => {
      const updatedLinks = (styleOptions.dataLinks || []).filter((link) => link.id !== id);
      onStyleChange({ dataLinks: updatedLinks });
    },
    [styleOptions.dataLinks, onStyleChange]
  );

  return (
    <EuiFlexItem grow={false}>
      <StyleAccordion
        id="dataLinkSection"
        accordionLabel={i18n.translate('explore.stylePanel.table.dataLinks', {
          defaultMessage: 'Data Links',
        })}
        initialIsOpen={true}
      >
        <EuiFlexGroup direction="column" gutterSize="s">
          <EuiFlexItem>
            <EuiButton
              size="s"
              onClick={() => setIsModalOpen(true)}
              data-test-subj="addDataLinkButton"
            >
              {i18n.translate('explore.stylePanel.table.dataLinks.addLinkButton', {
                defaultMessage: 'Add Link',
              })}
            </EuiButton>
          </EuiFlexItem>
          {(styleOptions.dataLinks || []).map((link) => (
            <EuiFlexItem key={link.id}>
              <EuiFlexGroup alignItems="center" gutterSize="s">
                <EuiFlexItem>
                  <EuiText size="s">{link.title}</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType="pencil"
                    onClick={() => {
                      setEditingLink(link);
                      setIsModalOpen(true);
                    }}
                    aria-label="Edit link"
                    data-test-subj={`editDataLink-${link.id}`}
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType="trash"
                    onClick={() => deleteLink(link.id)}
                    aria-label="Delete link"
                    data-test-subj={`deleteDataLink-${link.id}`}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
        {isModalOpen && (
          <DataLinkModal
            link={editingLink}
            onSave={addOrUpdateLink}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingLink(undefined);
            }}
            availableFields={availableFields}
          />
        )}
      </StyleAccordion>
    </EuiFlexItem>
  );
};
