/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiCallOut,
  EuiColorPicker,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFieldText,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSmallButton,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SavedObjectAnnotation, SavedObjectAnnotationService } from '../../../../core/public';
import { TAG_ANNOTATION_TYPE } from '../../common';
import { TagAssignmentModalProps } from '../types';
import { renderTagOption } from './tag_option';

interface Props extends TagAssignmentModalProps {
  annotationService: SavedObjectAnnotationService;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : i18n.translate('savedObjectTags.tagAssignmentModal.unknownError', {
        defaultMessage: 'An unexpected error occurred.',
      });

const normalizeTagName = (name: string) => name.trim().toLowerCase();

export const TagAssignmentModal = ({ annotationService, target, onClose, onChange }: Props) => {
  const [tags, setTags] = useState<SavedObjectAnnotation[]>([]);
  const [initialTagIds, setInitialTagIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('');
  const { objectId, objectType } = target;

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setErrorMessage(undefined);

    Promise.all([
      annotationService.findAnnotations({ type: TAG_ANNOTATION_TYPE }),
      annotationService.getAnnotationsForObject({
        type: TAG_ANNOTATION_TYPE,
        target: { objectId, objectType },
      }),
    ])
      .then(([availableTags, assignedTags]) => {
        if (!mounted) {
          return;
        }

        const assignedTagIds = assignedTags.map(({ id }) => id);
        setTags(availableTags);
        setInitialTagIds(assignedTagIds);
        setSelectedTagIds(assignedTagIds);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [annotationService, objectId, objectType]);

  const options = useMemo<Array<EuiComboBoxOptionOption<string>>>(
    () =>
      tags.map((tag) => ({
        label: tag.name,
        key: tag.id,
        value: tag.id,
        color: typeof tag.payload?.color === 'string' ? tag.payload.color : undefined,
      })),
    [tags]
  );

  const selectedOptions = options.filter(
    ({ value }) => typeof value === 'string' && selectedTagIds.includes(value)
  );
  const duplicateTag = useMemo(() => {
    if (!showCreateTag) {
      return undefined;
    }

    const normalizedName = normalizeTagName(newTagName);
    return tags.find((tag) => normalizeTagName(tag.name) === normalizedName);
  }, [newTagName, showCreateTag, tags]);
  const duplicateTagError = duplicateTag
    ? i18n.translate('savedObjectTags.tagAssignmentModal.duplicateTagError', {
        defaultMessage: 'A tag named "{tagName}" already exists. Select the existing tag instead.',
        values: {
          tagName: duplicateTag.name,
        },
      })
    : undefined;

  const saveAssignments = async () => {
    setIsSaving(true);
    setErrorMessage(undefined);

    const initialTagIdSet = new Set(initialTagIds);
    const selectedTagIdSet = new Set(selectedTagIds);
    const tagIdsToAdd = selectedTagIds.filter((tagId) => !initialTagIdSet.has(tagId));
    const tagIdsToRemove = initialTagIds.filter((tagId) => !selectedTagIdSet.has(tagId));

    try {
      for (const annotationId of tagIdsToAdd) {
        await annotationService.addAnnotationToObject({
          annotationId,
          type: TAG_ANNOTATION_TYPE,
          target: { objectId, objectType },
        });
      }

      for (const annotationId of tagIdsToRemove) {
        await annotationService.removeAnnotationFromObject({
          annotationId,
          type: TAG_ANNOTATION_TYPE,
          target: { objectId, objectType },
        });
      }

      if (showCreateTag) {
        const newTag = await annotationService.createAnnotation({
          type: TAG_ANNOTATION_TYPE,
          name: newTagName,
          payload: newTagColor ? { color: newTagColor } : undefined,
        });
        await annotationService.addAnnotationToObject({
          annotationId: newTag.id,
          type: TAG_ANNOTATION_TYPE,
          target: { objectId, objectType },
        });
      }

      onChange?.();
      onClose();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsSaving(false);
    }
  };

  return (
    <EuiModal data-test-subj="savedObjectTagAssignmentModal" maxWidth={560} onClose={onClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {i18n.translate('savedObjectTags.tagAssignmentModal.title', {
            defaultMessage: 'Manage tags',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {errorMessage && (
          <>
            <EuiCallOut
              color="danger"
              iconType="alert"
              title={i18n.translate('savedObjectTags.tagAssignmentModal.errorTitle', {
                defaultMessage: 'Unable to update tags',
              })}
            >
              <p>{errorMessage}</p>
            </EuiCallOut>
            <EuiSpacer size="m" />
          </>
        )}

        <EuiFormRow
          fullWidth
          label={i18n.translate('savedObjectTags.tagAssignmentModal.tagsLabel', {
            defaultMessage: 'Tags',
          })}
        >
          <EuiComboBox
            compressed
            data-test-subj="savedObjectTagAssignmentSelect"
            fullWidth
            isLoading={isLoading}
            options={options}
            selectedOptions={selectedOptions}
            renderOption={renderTagOption}
            placeholder={i18n.translate('savedObjectTags.tagAssignmentModal.tagsPlaceholder', {
              defaultMessage: 'Select tags',
            })}
            onChange={(selection) =>
              setSelectedTagIds(
                selection.flatMap(({ value }) => (typeof value === 'string' ? [value] : []))
              )
            }
          />
        </EuiFormRow>

        <EuiSpacer size="s" />

        {!showCreateTag ? (
          <EuiButtonEmpty
            data-test-subj="savedObjectTagAssignmentShowCreate"
            flush="left"
            iconType="plusInCircle"
            size="xs"
            onClick={() => setShowCreateTag(true)}
          >
            {i18n.translate('savedObjectTags.tagAssignmentModal.createTagButton', {
              defaultMessage: 'Create tag',
            })}
          </EuiButtonEmpty>
        ) : (
          <>
            <EuiFormRow
              error={duplicateTagError}
              fullWidth
              isInvalid={Boolean(duplicateTag)}
              label={i18n.translate('savedObjectTags.tagAssignmentModal.newTagNameLabel', {
                defaultMessage: 'New tag name',
              })}
            >
              <EuiFieldText
                autoFocus
                compressed
                data-test-subj="savedObjectTagAssignmentName"
                fullWidth
                isInvalid={Boolean(duplicateTag)}
                value={newTagName}
                onChange={(event) => setNewTagName(event.target.value)}
              />
            </EuiFormRow>
            <EuiFormRow
              fullWidth
              label={i18n.translate('savedObjectTags.tagAssignmentModal.newTagColorLabel', {
                defaultMessage: 'Color',
              })}
              labelAppend={
                <EuiButtonEmpty
                  data-test-subj="savedObjectTagAssignmentCancelCreate"
                  flush="right"
                  size="xs"
                  onClick={() => {
                    setShowCreateTag(false);
                    setNewTagName('');
                    setNewTagColor('');
                  }}
                >
                  {i18n.translate('savedObjectTags.tagAssignmentModal.cancelCreateTagButton', {
                    defaultMessage: 'Cancel',
                  })}
                </EuiButtonEmpty>
              }
            >
              <EuiColorPicker color={newTagColor} compressed fullWidth onChange={setNewTagColor} />
            </EuiFormRow>
          </>
        )}
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty size="s" data-test-subj="savedObjectTagAssignmentCancel" onClick={onClose}>
          {i18n.translate('savedObjectTags.tagAssignmentModal.cancelButton', {
            defaultMessage: 'Cancel',
          })}
        </EuiButtonEmpty>
        <EuiSmallButton
          data-test-subj="savedObjectTagAssignmentSave"
          fill
          isDisabled={isLoading || Boolean(duplicateTag)}
          isLoading={isSaving}
          onClick={saveAssignments}
        >
          {i18n.translate('savedObjectTags.tagAssignmentModal.saveButton', {
            defaultMessage: 'Save',
          })}
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
