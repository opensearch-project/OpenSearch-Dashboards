/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { EuiBadge, EuiBadgeGroup } from '@elastic/eui';
import { SavedObjectAnnotation, SavedObjectAnnotationService } from '../../../../core/public';
import { TAG_ANNOTATION_TYPE } from '../../common';
import { TagListProps } from '../types';

interface Props extends TagListProps {
  annotationService: SavedObjectAnnotationService;
}

export const TagList = ({
  annotationService,
  target,
  refreshKey,
  loadingContent,
  emptyContent,
}: Props) => {
  const [tags, setTags] = useState<SavedObjectAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { objectId, objectType } = target;

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    annotationService
      .getAnnotationsForObject({
        type: TAG_ANNOTATION_TYPE,
        target: {
          objectId,
          objectType,
        },
      })
      .then((annotations) => {
        if (mounted) {
          setTags(annotations);
        }
      })
      .catch(() => {
        if (mounted) {
          setTags([]);
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
  }, [annotationService, objectId, objectType, refreshKey]);

  if (isLoading) {
    return loadingContent ? <>{loadingContent}</> : null;
  }

  if (!tags.length) {
    return emptyContent ? <>{emptyContent}</> : null;
  }

  return (
    <EuiBadgeGroup data-test-subj="savedObjectTagList">
      {tags.map((tag) => (
        <EuiBadge
          key={tag.id}
          color={typeof tag.payload?.color === 'string' ? tag.payload.color : 'hollow'}
        >
          {tag.name}
        </EuiBadge>
      ))}
    </EuiBadgeGroup>
  );
};
