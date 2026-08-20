/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { EuiComboBox, EuiComboBoxOptionOption } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SavedObjectAnnotation, SavedObjectAnnotationService } from '../../../../core/public';
import { TAG_ANNOTATION_TYPE } from '../../common';
import { TagSelectorProps } from '../types';

interface Props extends TagSelectorProps {
  annotationService: SavedObjectAnnotationService;
}

export const TagSelector = ({ annotationService, selectedTagId, onChange }: Props) => {
  const [tags, setTags] = useState<SavedObjectAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setHasError(false);
    annotationService
      .findAnnotations({ type: TAG_ANNOTATION_TYPE })
      .then((annotations) => {
        if (mounted) {
          setTags(annotations);
        }
      })
      .catch(() => {
        if (mounted) {
          setHasError(true);
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
  }, [annotationService]);

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
  const selectedOptions = selectedTagId
    ? options.filter(({ value }) => value === selectedTagId)
    : [];

  if (hasError) {
    return null;
  }

  return (
    <EuiComboBox
      aria-label={i18n.translate('savedObjectTags.tagSelector.ariaLabel', {
        defaultMessage: 'Filter by tag',
      })}
      data-test-subj="savedObjectTagSelector"
      placeholder={i18n.translate('savedObjectTags.tagSelector.placeholder', {
        defaultMessage: 'Filter by tag',
      })}
      options={options}
      selectedOptions={selectedOptions}
      singleSelection={{ asPlainText: true }}
      isClearable
      isLoading={isLoading}
      fullWidth
      onChange={(selection) => onChange(selection[0]?.value)}
    />
  );
};
