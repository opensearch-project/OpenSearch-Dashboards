/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import { EuiEmptyPrompt, EuiResizableContainer, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SectionList } from './section_list';
import { SectionPanel } from './section_panel';
import { QueryAddButton, QueryItemActions, TransformItemActions } from './section_item_actions';
import {
  QueryRowItem,
  SectionItem,
  buildQuerySection,
  buildTransformSection,
  resolveActiveSelection,
} from './utils';
import { useQueryBuilderState } from '../../hooks/use_query_builder_state';
import { QueryPanel } from '../visualization_editor_query_panel';
import { DatasetSelectWidget } from '../dataset_select';
import {
  TransformationService,
  TransformationStepIssues,
} from '../../../../components/data_transformations';
import { TransformationAddButton } from './add_transformation_button';
import { QueryRowIssues } from './query_row_issues';
import { QueryOptionsBar, QueryOptionsOverlay } from './query_options';
import './query_workspace.scss';

export interface QueryWorkspaceProps {
  transformServices: TransformationService;
}

export const QueryWorkspace = ({ transformServices }: QueryWorkspaceProps) => {
  const { queryBuilder, container } = useQueryBuilderState();
  const transformPipeline = useObservable(
    transformServices.pipeline$,
    transformServices.pipeline$.getValue()
  );
  const stageFieldsMap = useObservable(
    transformServices.stageFields$,
    transformServices.stageFields$.getValue()
  );
  const transformStepResults = useObservable(
    transformServices.stepResults$,
    transformServices.stepResults$.getValue()
  );

  // Every row of the container, each with its own hidden / valid flags.
  const queryRowItems$ = useMemo(() => container.getQueryRowItems$(), [container]);
  const queryRows: QueryRowItem[] = useObservable(queryRowItems$, container.getQueryRowItems());

  const getQueryRowBuilder = useCallback(
    (refId?: string) => (refId ? container.getRow(refId) : undefined),
    [container]
  );

  // Only a transformation selection is kept here; the query selection is the container's
  // selected row (which the editor and widgets follow), so the two can't disagree.
  const [selectedTransformationId, setSelectedTransformationId] = useState<string>();

  const [isQueryOptionsOpen, setIsQueryOptionsOpen] = useState(false);
  const { maxDataPoints } = useObservable(
    container.multiQueryEditorState$,
    container.multiQueryEditorState$.getValue()
  );

  const selectQueryRow = useCallback(
    (refId: string) => {
      setSelectedTransformationId(undefined);
      container.selectRow(refId);
    },
    [container]
  );

  // Read the pipeline at call time: a just-added step isn't in transformPipeline until the next
  // render. Anything else is a query row.
  const onSelectItem = useCallback(
    (id: string) => {
      if (transformServices.pipeline$.getValue().some((t) => t.instance_id === id)) {
        setSelectedTransformationId(id);
      } else {
        selectQueryRow(id);
      }
    },
    [selectQueryRow, transformServices]
  );

  const queryHandlers = useMemo(
    () => ({
      onAdd: () => selectQueryRow(container.addRow().refId),
      onRemove: (refId: string) => container.removeRow(refId),
      onReorder: (fromIndex: number, toIndex: number) => container.reorderRows(fromIndex, toIndex),
      onDuplicate: (refId: string) => {
        const copy = container.duplicateRow(refId);
        if (copy) selectQueryRow(copy.refId);
      },
      onToggleHide: (refId: string) => {
        const row = container.getRow(refId);
        row?.updateQueryEditorState({ isHidden: !row.getQueryEditorState().isHidden });
        if (row) container.markStale();
      },
    }),
    [container, selectQueryRow]
  );

  const removeTransformation = useCallback(
    (id: string) => {
      transformServices.removeInstance(id);
      // The open step was removed: go back to the first query.
      if (id === selectedTransformationId) {
        const firstRow = container.getAllRows()[0];
        if (firstRow) selectQueryRow(firstRow.refId);
      }
    },
    [container, selectQueryRow, selectedTransformationId, transformServices]
  );

  const sections = useMemo(
    () => [
      buildQuerySection(queryRows, queryHandlers.onReorder),
      buildTransformSection(transformPipeline, transformServices, transformStepResults),
    ],
    [queryRows, queryHandlers, transformPipeline, transformServices, transformStepResults]
  );

  const active = useMemo(
    () =>
      resolveActiveSelection({
        queryIds: queryRows.map((row) => row.refId),
        transformIds: transformPipeline.map((t) => t.instance_id),
        selectedQueryRefId: queryBuilder.refId,
        selectedTransformationId,
      }),
    [queryRows, transformPipeline, queryBuilder.refId, selectedTransformationId]
  );
  const activeItemId = active.activeItemId;

  const onAddTransformation = useCallback(
    (definitionId: string) => {
      const currentIds = new Set(transformServices.pipeline$.getValue().map((t) => t.instance_id));
      transformServices.addInstance(definitionId);

      const created = transformServices.pipeline$
        .getValue()
        .find((instance) => !currentIds.has(instance.instance_id));
      if (created) {
        onSelectItem(created.instance_id);
      }
    },
    [onSelectItem, transformServices]
  );

  const sectionsWithActions = useMemo(
    () =>
      sections.map((section) => {
        if (section.id === 'queries') {
          return {
            ...section,
            renderAddAction: <QueryAddButton onAdd={queryHandlers.onAdd} />,
            renderItemActions: (item: SectionItem) => (
              <QueryItemActions
                item={item}
                canRemove={!!queryHandlers.onRemove && queryRows.length > 1}
                onRemove={queryHandlers.onRemove}
                onToggleHide={queryHandlers.onToggleHide}
                onDuplicate={queryHandlers.onDuplicate}
              />
            ),
          };
        }
        if (section.id === 'transformations') {
          return {
            ...section,
            renderAddAction: (
              <TransformationAddButton
                definitions={transformServices.getDefinitions()}
                onSelectTransformation={onAddTransformation}
              />
            ),
            renderItemActions: (item: SectionItem) => (
              <TransformItemActions
                item={item}
                onToggleHide={(id) => transformServices.toggleInstanceHide(id)}
                onRemove={removeTransformation}
              />
            ),
          };
        }
        return section;
      }),
    [
      onAddTransformation,
      queryHandlers,
      queryRows.length,
      removeTransformation,
      sections,
      transformServices,
    ]
  );

  const sectionPanelMeta = useMemo(() => {
    if (active.currentActive === 'query') {
      return {
        title: i18n.translate('explore.queryWorkspace.queryDetailTitle', {
          defaultMessage: 'Query',
        }),
        subtitle: active.activeItemId,
        iconType: 'database',
        headerContent: <DatasetSelectWidget key={active.activeItemId} />,
      };
    }

    if (active.currentActive === 'transformation') {
      const instance = transformPipeline.find((t) => t.instance_id === active.activeItemId);
      const definition = instance
        ? transformServices.getDefinition(instance.definition_id)
        : undefined;

      return {
        title: i18n.translate('explore.queryWorkspace.transformationDetailTitle', {
          defaultMessage: 'Transformation',
        }),
        subtitle: definition?.label ?? instance?.definition_id,
        iconType: definition?.iconType ?? 'function',
      };
    }

    return undefined;
  }, [active, transformPipeline, transformServices]);

  // The active item's actions (hide / remove), same renderers and handlers as its list row.
  const activeItemActions = useMemo(() => {
    for (const section of sectionsWithActions) {
      const item = section.items.find((i) => i.id === activeItemId);
      if (item) {
        return section.renderItemActions?.(item);
      }
    }
    return undefined;
  }, [activeItemId, sectionsWithActions]);

  const renderDetail = () => {
    if (active.currentActive === 'query') {
      const row = getQueryRowBuilder(active.activeItemId);
      if (!row) return null;
      return (
        <>
          <QueryRowIssues key={`issues-${row.refId}`} queryEditorState$={row.queryEditorState$} />
          <QueryPanel
            key={row.refId}
            queryState$={row.queryState$}
            queryEditorState$={row.queryEditorState$}
          />
        </>
      );
    }

    if (active.currentActive === 'transformation') {
      const instance = transformPipeline.find((t) => t.instance_id === active.activeItemId);
      if (!instance) return null;
      const { Editor } = instance;
      return (
        <>
          <TransformationStepIssues step={transformStepResults.get(instance.instance_id)} />
          <Editor
            config={instance.config}
            onChange={(newConfig) =>
              transformServices.updateInstanceConfig(instance.instance_id, newConfig)
            }
            availableFields={stageFieldsMap.get(instance.instance_id) ?? []}
          />
        </>
      );
    }

    return renderEmpty();
  };

  return (
    <div className="queryWorkspace">
      <EuiResizableContainer className="queryWorkspace__body">
        {(EuiResizablePanel, EuiResizableButton) => (
          <>
            <EuiResizablePanel
              initialSize={20}
              minSize="10%"
              paddingSize="s"
              // OUI strips borders unless color is plain.
              color="plain"
              hasBorder
              borderRadius="m"
              className="queryWorkspace__card"
            >
              {sectionsWithActions.map((section) => (
                <React.Fragment key={section.id}>
                  <SectionList
                    section={section}
                    activeItemId={activeItemId}
                    onSelectItem={onSelectItem}
                  />
                  <EuiSpacer size="m" />
                </React.Fragment>
              ))}
            </EuiResizablePanel>

            <EuiResizableButton />

            <EuiResizablePanel
              initialSize={80}
              minSize="50%"
              paddingSize="none"
              color="plain"
              hasBorder
              borderRadius="m"
              className="queryWorkspace__card"
            >
              <SectionPanel
                title={sectionPanelMeta?.title}
                subtitle={sectionPanelMeta?.subtitle}
                iconType={sectionPanelMeta?.iconType}
                actions={activeItemActions}
                headerContent={sectionPanelMeta?.headerContent}
                activeType={active.currentActive}
                footer={
                  <QueryOptionsBar
                    isOpen={isQueryOptionsOpen}
                    maxDataPoints={maxDataPoints}
                    onToggle={() => setIsQueryOptionsOpen((open) => !open)}
                  />
                }
                overlay={
                  isQueryOptionsOpen && (
                    <QueryOptionsOverlay
                      maxDataPoints={maxDataPoints}
                      onMaxDataPointsChange={(next) => container.setMaxDataPoints(next)}
                      onClose={() => setIsQueryOptionsOpen(false)}
                    />
                  )
                }
              >
                {renderDetail()}
              </SectionPanel>
            </EuiResizablePanel>
          </>
        )}
      </EuiResizableContainer>
    </div>
  );
};

const renderEmpty = () => (
  <EuiEmptyPrompt
    iconType="inspect"
    title={
      <h3>
        {i18n.translate('explore.queryWorkspace.emptyDetailTitle', {
          defaultMessage: 'No queries or transformations',
        })}
      </h3>
    }
    body={
      <p>
        {i18n.translate('explore.queryWorkspace.emptyDetailBody', {
          defaultMessage: 'Add a query or transformation to get started.',
        })}
      </p>
    }
  />
);
