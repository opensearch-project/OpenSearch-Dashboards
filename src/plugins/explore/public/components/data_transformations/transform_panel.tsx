/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useRef } from 'react';
import { useObservable } from 'react-use';
import { isEqual } from 'lodash';
import {
  EuiAccordion,
  EuiButtonIcon,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  euiDragDropReorder,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TransformSelectorButton } from './transform_selector_overlay';
import { TransformationInstance, FieldSchema } from './types';
import { TransformationService } from './transformation_service';
import { FIELD_TYPE_MAP } from '../visualizations/constants';
import { VisFieldType } from '../visualizations/types';

const DROPPABLE_ID = 'transformationPipelineDroppable';

export interface TransformPanelProps {
  transformationService: TransformationService;
}

export const TransformPanel = ({ transformationService }: TransformPanelProps) => {
  const pipeline = useObservable(
    transformationService.pipeline$,
    transformationService.pipeline$.getValue()
  );

  const stageSchemasMap = useObservable(
    transformationService.stageSchemas$,
    transformationService.stageSchemas$.getValue()
  );

  // stageSchemas$ is updated asynchronously via handleData
  // among this gap, each editor still use its last own stage schemas
  const availableFieldsForInstanceId = useMemo(() => {
    const result = new Map<string, FieldSchema[]>();
    stageSchemasMap.forEach((raw, instanceId) => {
      result.set(
        instanceId,
        raw.map((field) => ({
          name: field.name || '',
          visFieldType: FIELD_TYPE_MAP[field.type || ''] || VisFieldType.Unknown,
        }))
      );
    });
    return result;
  }, [stageSchemasMap]);

  const getAvailableFieldsForInstance = (instanceId: string): FieldSchema[] => {
    return availableFieldsForInstanceId.get(instanceId) ?? [];
  };

  const onSelectTransformation = (id: string) => {
    transformationService.addInstance(id);
  };

  const onRemove = (instanceId: string) => {
    transformationService.removeInstance(instanceId);
  };

  const onConfigChange = (instanceId: string, newConfig: Record<string, unknown>) => {
    transformationService.updateInstanceConfig(instanceId, newConfig);
  };

  const onToggleHide = (instanceId: string) => {
    transformationService.toggleInstanceHide(instanceId);
  };

  const onDragEnd = ({
    source,
    destination,
  }: {
    source: { index: number };
    destination: { index: number } | null | undefined;
  }) => {
    if (!source || !destination) return;
    const reordered = euiDragDropReorder(pipeline, source.index, destination.index);
    transformationService.setPipeline(reordered);
  };

  return (
    <EuiPanel
      paddingSize="s"
      hasBorder={false}
      hasShadow={false}
      borderRadius="none"
      style={{ height: '100%', overflowY: 'auto' }}
    >
      {pipeline.length === 0 && (
        <>
          <EuiTitle size="xs">
            <h2>
              {i18n.translate('explore.transformPanel.emptyTitle', {
                defaultMessage: 'Add a Transformation',
              })}
            </h2>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText size="s" color="subdued">
            {i18n.translate('explore.transformPanel.emptyDescription', {
              defaultMessage:
                'Transformations allow data to be changed in various ways before your visualization is shown.',
            })}
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}

      {pipeline.length > 0 && (
        <>
          <EuiDragDropContext onDragEnd={onDragEnd}>
            <EuiDroppable droppableId={DROPPABLE_ID}>
              {pipeline.map((instance: TransformationInstance, index: number) => (
                <EuiDraggable
                  spacing="s"
                  key={instance.instance_id}
                  index={index}
                  draggableId={instance.instance_id}
                >
                  {(provided) => (
                    <TransformationCard
                      index={index}
                      instance={instance}
                      label={
                        transformationService.getDefinition(instance.definition_id)?.label ??
                        instance.definition_id
                      }
                      onRemove={onRemove}
                      onConfigChange={onConfigChange}
                      onToggleHide={onToggleHide}
                      dragHandleProps={provided.dragHandleProps}
                      availableFields={getAvailableFieldsForInstance(instance.instance_id)}
                    />
                  )}
                </EuiDraggable>
              ))}
            </EuiDroppable>
          </EuiDragDropContext>
          <EuiSpacer size="s" />
        </>
      )}

      <TransformSelectorButton
        transformationService={transformationService}
        onSelectTransformation={onSelectTransformation}
      />
    </EuiPanel>
  );
};

interface TransformationCardProps {
  index: number;
  instance: TransformationInstance;
  label: string;
  onRemove: (id: string) => void;
  onConfigChange: (id: string, newConfig: any) => void;
  onToggleHide: (id: string) => void;
  dragHandleProps: Record<string, any> | null | undefined;
  availableFields: FieldSchema[];
}

const TransformationCard = ({
  index,
  instance,
  label,
  onRemove,
  onConfigChange,
  onToggleHide,
  dragHandleProps,
  availableFields,
}: TransformationCardProps) => {
  const { Editor } = instance;

  const fieldsRef = useRef(availableFields);
  if (!isEqual(fieldsRef.current, availableFields)) {
    fieldsRef.current = availableFields;
  }

  return (
    <EuiPanel paddingSize="m" hasBorder hasShadow={false}>
      <EuiAccordion
        id={`transformation-accordion-${instance.instance_id}`}
        initialIsOpen={true}
        buttonContent={
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem>
              <EuiText size="s" color={instance.hide ? 'subdued' : 'default'}>
                <strong>{`${index + 1} - ${label}`}</strong>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
        extraAction={
          <EuiFlexGroup gutterSize="xs" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType={instance.hide ? 'eyeClosed' : 'eye'}
                color="text"
                aria-label={instance.hide ? 'Show transformation' : 'Hide transformation'}
                onClick={() => onToggleHide(instance.instance_id)}
                data-test-subj={`transformHideButton-${instance.instance_id}`}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="trash"
                color="text"
                aria-label="Remove transformation"
                onClick={() => onRemove(instance.instance_id)}
                data-test-subj={`transformRemoveButton-${instance.instance_id}`}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <span
                {...dragHandleProps}
                style={{
                  cursor: 'grab',
                  marginLeft: '10px',
                }}
              >
                {/* drag icon can't be used, use icon app as a similar substitute  */}
                <EuiIcon type="apps" />
              </span>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
      >
        <EuiSpacer size="s" />
        <Editor
          config={instance.config}
          onChange={(newConfig) => onConfigChange(instance.instance_id, newConfig)}
          availableFields={fieldsRef.current}
        />
      </EuiAccordion>
    </EuiPanel>
  );
};
