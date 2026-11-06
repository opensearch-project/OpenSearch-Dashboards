/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { i18n } from '@osd/i18n';
import {
  TransformationInstance,
  TransformationService,
  TransformationStepResult,
} from '../../../../components/data_transformations';

export interface SectionItem {
  id: string;
  label: string;
  iconType?: string;
  isHidden?: boolean;
  isValid?: boolean;
  showStepWarning?: boolean;
}

/**
 * One section (group) in the rail. The rail can render N of these stacked.
 * `queries` and `transformations` are two instances of this same shape.
 */
export interface Section {
  id: string;
  title: string;
  items: SectionItem[];
  /** Custom add affordance, used when adding needs its own chooser UI. */
  renderAddAction?: ReactNode;
  /** Renders the section's `+` add affordance when provided. */
  onAdd?: () => void;
  // /** Opt-in drag reorder (transforms: true, queries: false). */
  /** Opt-in drag reorder (transforms: always; queries: only with a reorder handler and >1 row). */
  draggable?: boolean;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Per-row trailing actions (hide / remove). Kept generic so the rail
   *  never needs to know what a query or a transform is. */
  renderItemActions?: (item: SectionItem) => ReactNode;
}

export interface QueryRowItem {
  refId: string;
  label?: string;
  isHidden?: boolean;
  isValid?: boolean;
}

export interface ActiveSelection {
  currentActive: 'query' | 'transformation' | 'none'; // current active section
  activeItemId?: string; // current active section item
}

// only for invalid transformation
const isStepValid = (step?: TransformationStepResult) => !step || step.status !== 'failed';

const showStepWarning = (step?: TransformationStepResult) =>
  step?.issues && step?.issues?.length > 0 && step.status !== 'failed';

export const buildQuerySection = (
  queryRows: QueryRowItem[],
  onReorder?: (fromIndex: number, toIndex: number) => void
): Section => ({
  id: 'queries',
  title: i18n.translate('explore.queryWorkspace.queriesSectionTitle', {
    defaultMessage: 'Queries',
  }),
  items: queryRows.map((row) => ({
    id: row.refId,
    label: row.label ?? row.refId,
    iconType: 'visBarVertical',
    isHidden: row.isHidden ?? false,
    isValid: row.isValid,
  })),
  // Only offer drag when it can actually reorder something.
  draggable: !!onReorder && queryRows.length > 1,
  onReorder,
});

export const buildTransformSection = (
  transformPipeline: TransformationInstance[],
  transformationService: TransformationService,
  transformStepResults?: Map<string, TransformationStepResult>
): Section => ({
  id: 'transformations',
  title: i18n.translate('explore.queryWorkspace.transformationsSectionTitle', {
    defaultMessage: 'Transformations',
  }),
  items: transformPipeline.map((instance) => {
    const definition = transformationService.getDefinition(instance.definition_id);
    const step = transformStepResults?.get(instance.instance_id);
    return {
      id: instance.instance_id,
      label: definition?.label ?? instance.definition_id,
      iconType: definition?.iconType ?? 'filter',
      isHidden: instance.hide,
      isValid: isStepValid(step),
      showStepWarning: showStepWarning(step),
    };
  }),
  draggable: true,
  onReorder: (fromIndex: number, toIndex: number) => {
    // Read the pipeline at call time rather than the build-time one.
    const next = [...transformationService.pipeline$.getValue()];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    transformationService.setPipeline(next);
  },
});

/**
 * What the detail panel shows. The query selection is the builder's selected row; only a
 * transformation selection is kept by the workspace, and it wins while that step exists.
 */
export const resolveActiveSelection = ({
  queryIds,
  transformIds,
  selectedQueryRefId,
  selectedTransformationId,
}: {
  queryIds: string[];
  transformIds: string[];
  selectedQueryRefId?: string;
  selectedTransformationId?: string;
}): ActiveSelection => {
  if (selectedTransformationId && transformIds.includes(selectedTransformationId)) {
    return { currentActive: 'transformation', activeItemId: selectedTransformationId };
  }
  if (selectedQueryRefId && queryIds.includes(selectedQueryRefId)) {
    return { currentActive: 'query', activeItemId: selectedQueryRefId };
  }
  if (queryIds.length > 0) {
    return { currentActive: 'query', activeItemId: queryIds[0] };
  }
  return { currentActive: 'none' };
};
