/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiButton,
  EuiButtonIcon,
  EuiContextMenu,
  EuiContextMenuPanelDescriptor,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPopover,
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

export const DataLinkModal: React.FC<DataLinkModalProps> = ({
  link,
  onSave,
  onCancel,
  availableFields,
}) => {
  const [title, setTitle] = useState(link?.title || '');
  const [url, setUrl] = useState(link?.url || '');
  const [openInNewTab, setOpenInNewTab] = useState(link?.openInNewTab ?? true);
  const [selectedFields, setSelectedFields] = useState<Array<{ label: string; value: string }>>(
    link?.fields
      .map((field) => {
        const fieldOption = availableFields.find((option) => option.value === field);
        return fieldOption ? { label: fieldOption.label, value: fieldOption.value } : null;
      })
      .filter((option): option is { label: string; value: string } => option !== null) || []
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const isSaveDisabled = !title.trim() || !url.trim() || selectedFields.length === 0;

  const handleSave = () => {
    onSave({
      id: link?.id || uuidv4(),
      title,
      url,
      openInNewTab,
      fields: selectedFields.map((option) => option.value),
    });
  };

  const handleAddField = useCallback((field: { label: string; value: string }) => {
    setSelectedFields((prev) => [...prev, field]);
  }, []);

  const handleRemoveField = (value: string) => {
    setSelectedFields((prev) => prev.filter((field) => field.value !== value));
  };

  const fieldOptions: EuiContextMenuPanelDescriptor[] = useMemo(
    () => [
      {
        id: 0,
        items: availableFields
          .filter((field) => !selectedFields.some((f) => f.value === field.value))
          .map((field) => ({
            name: field.label,
            onClick: () => handleAddField(field),
            'data-test-subj': `dataLinkFieldOption-${field.value}`,
          })),
      },
    ],
    [availableFields, selectedFields, handleAddField]
  );

  return (
    <EuiModal onClose={onCancel}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {link
            ? i18n.translate('explore.stylePanel.table.dataLinks.editModalTitle', {
                defaultMessage: 'Edit Link',
              })
            : i18n.translate('explore.stylePanel.table.dataLinks.addModalTitle', {
                defaultMessage: 'Add link',
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
          <EuiFlexGroup wrap gutterSize="s" alignItems="center">
            {selectedFields.map((field) => (
              <EuiFlexItem grow={false} key={field.value}>
                <EuiBadge
                  color="hollow"
                  iconType="cross"
                  iconSide="right"
                  onClick={() => handleRemoveField(field.value)}
                  onClickAriaLabel={`Remove ${field.label}`}
                  data-test-subj={`dataLinkFieldBadge-${field.value}`}
                >
                  {field.label}
                </EuiBadge>
              </EuiFlexItem>
            ))}
            <EuiFlexItem grow={false}>
              <EuiPopover
                button={
                  <EuiButtonIcon
                    iconType="plusInCircle"
                    onClick={() => setIsPopoverOpen(true)}
                    aria-label="Add Field"
                    data-test-subj="dataLinkAddFieldButton"
                  />
                }
                isOpen={isPopoverOpen}
                closePopover={() => setIsPopoverOpen(false)}
                panelPaddingSize="s"
                anchorPosition="downLeft"
              >
                <EuiContextMenu
                  size="s"
                  initialPanelId={0}
                  panels={fieldOptions}
                  data-test-subj="dataLinkFieldContextMenu"
                />
              </EuiPopover>
            </EuiFlexItem>
          </EuiFlexGroup>
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

  const availableFields = useMemo(
    () => [
      ...numericalColumns.map((col: VisColumn) => ({
        label: col.name || col.column,
        value: col.column,
      })),
      ...categoricalColumns.map((col: VisColumn) => ({
        label: col.name || col.column,
        value: col.column,
      })),
      ...dateColumns.map((col: VisColumn) => ({
        label: col.name || col.column,
        value: col.column,
      })),
    ],
    [numericalColumns, categoricalColumns, dateColumns]
  );

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
      {/* @ts-expect-error TS2322 TODO(ts-error): fixme */}
      <StyleAccordion
        id="dataLinkSection"
        accordionLabel={i18n.translate('explore.stylePanel.table.dataLinks', {
          defaultMessage: 'Data links',
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
                defaultMessage: 'Add link',
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
