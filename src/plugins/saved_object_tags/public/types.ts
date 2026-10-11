/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentType, ReactNode } from 'react';
import { SavedObjectAnnotationTarget } from '../../../core/public';

export interface TagSelectorProps {
  selectedTagId?: string;
  onChange: (tagId?: string) => void;
}

export interface TagListProps {
  target: SavedObjectAnnotationTarget;
  refreshKey?: number;
  loadingContent?: ReactNode;
  emptyContent?: ReactNode;
}

export interface TagAssignmentModalProps {
  target: SavedObjectAnnotationTarget;
  onClose: () => void;
  onChange?: () => void;
}

export interface SavedObjectTagsStart {
  ui: {
    TagSelector: ComponentType<TagSelectorProps>;
    TagList: ComponentType<TagListProps>;
    TagAssignmentModal: ComponentType<TagAssignmentModalProps>;
  };
}
