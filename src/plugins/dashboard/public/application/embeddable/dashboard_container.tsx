/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import './_dashboard_container.scss';

import { isEqual } from 'lodash';
import { Subscription } from 'rxjs';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { I18nProvider } from '@osd/i18n/react';
import { RefreshInterval, TimeRange, Query, Filter } from 'src/plugins/data/public';
import { CoreStart, Logos } from 'src/core/public';
import { Start as InspectorStartContract } from 'src/plugins/inspector/public';
import { v4 as uuidv4 } from 'uuid';
import {
  Container,
  ContainerInput,
  EmbeddableInput,
  ViewMode,
  EmbeddableFactory,
  IEmbeddable,
  EmbeddableStart,
  PanelState,
  EmbeddableStateTransfer,
  EmbeddableOutput,
} from '../../../../embeddable/public';
import { UiActionsStart } from '../../../../ui_actions/public';
import { DataPublicPluginStart } from '../../../../data/public';
import { DASHBOARD_CONTAINER_TYPE } from './dashboard_constants';
import { VariableService } from '../../variables/variable_service';
import { Variable } from '../../variables/types';
import {
  VariableInterpolationService,
  IVariableInterpolationService,
} from '../../variables/variable_interpolation_service';
import { createPanelState } from './panel';
import { DashboardPanelState } from './types';
import { DashboardViewport } from './viewport/dashboard_viewport';
import {
  OpenSearchDashboardsContextProvider,
  OpenSearchDashboardsReactContext,
  OpenSearchDashboardsReactContextValue,
} from '../../../../opensearch_dashboards_react/public';
import { PLACEHOLDER_EMBEDDABLE } from './placeholder';
import { PanelPlacementMethod, IPanelPlacementArgs } from './panel/dashboard_panel_placement';
import { DashboardLayout } from '../../../common';
import { appendMemberToSection, removeMemberFromLayout } from './section_layout_utils';

export interface DashboardContainerInput extends ContainerInput {
  viewMode: ViewMode;
  filters: Filter[];
  query: Query;
  timeRange: TimeRange;
  refreshConfig?: RefreshInterval;
  expandedPanelId?: string;
  useMargins: boolean;
  useSharedCrosshair?: boolean;
  title: string;
  description?: string;
  isEmbeddedExternally?: boolean;
  isFullScreenMode: boolean;
  panels: {
    [panelId: string]: DashboardPanelState<EmbeddableInput & { [k: string]: unknown }>;
  };
  isEmptyState?: boolean;
  variables?: Variable[];
  /**
   * Section layout descriptor. Undefined / `GridLayout` renders the classic single
   * grid of `panels`; `SectionLayout` renders sections (each with its own inner grid)
   * whose members reference panel ids in `panels`.
   */
  layout?: DashboardLayout;
}

interface IndexSignature {
  [key: string]: unknown;
}

export interface InheritedChildInput extends IndexSignature {
  filters: Filter[];
  query: Query;
  timeRange: TimeRange;
  refreshConfig?: RefreshInterval;
  viewMode: ViewMode;
  hidePanelTitles?: boolean;
  useSharedCrosshair?: boolean;
  id: string;
}

export interface DashboardContainerOptions {
  application: CoreStart['application'];
  overlays: CoreStart['overlays'];
  notifications: CoreStart['notifications'];
  chrome: CoreStart['chrome'];
  embeddable: EmbeddableStart;
  inspector: InspectorStartContract;
  SavedObjectFinder: React.ComponentType<any>;
  ExitFullScreenButton: React.ComponentType<any>;
  uiActions: UiActionsStart;
  data?: DataPublicPluginStart;
  initialVariables?: Variable[];
  savedObjects?: CoreStart['savedObjects'];
  telemetry?: CoreStart['telemetry'];
  // Dashboard collapsible sections feature flag (dashboard.allowDashboardSections).
  // The viewport reads this to decide whether to render a saved SectionLayout as
  // sections. When off, a dashboard that still has layoutJSON renders as a flat
  // GridLayout (using panelsJSON.gridData) so turning the flag off cleanly hides
  // the feature. Defaults to off/unchanged behavior when absent.
  allowDashboardSections?: boolean;
}

export type DashboardReactContextValue =
  OpenSearchDashboardsReactContextValue<DashboardContainerOptions>;
export type DashboardReactContext = OpenSearchDashboardsReactContext<DashboardContainerOptions>;

export class DashboardContainer extends Container<InheritedChildInput, DashboardContainerInput> {
  public readonly type = DASHBOARD_CONTAINER_TYPE;

  public renderEmpty?: undefined | (() => React.ReactNode);
  public updateAppStateUrl?:
    undefined | (({ replace, pathname }: { replace: boolean; pathname?: string }) => void);

  private embeddablePanel: EmbeddableStart['EmbeddablePanel'];
  private readonly logos: Logos;
  private root?: Root;
  private variableSubscriptions: Subscription[] = [];
  // Transient: which section a "Create new visualization" was launched from.
  // Set and consumed synchronously around the editor navigation; never persisted.
  private pendingCreateSectionId?: string;
  public readonly variableService: VariableService;
  public readonly variableInterpolationService: IVariableInterpolationService;

  constructor(
    initialInput: DashboardContainerInput,
    private readonly options: DashboardContainerOptions,
    stateTransfer?: EmbeddableStateTransfer,
    parent?: Container
  ) {
    super(
      {
        ...initialInput,
      },
      { embeddableLoaded: {} },
      options.embeddable.getEmbeddableFactory,
      parent
    );
    this.embeddablePanel = options.embeddable.getEmbeddablePanel(stateTransfer);
    this.logos = options.chrome.logos;

    this.variableService = new VariableService(
      options.data,
      initialInput.id,
      options.savedObjects?.client,
      (event) => options.telemetry?.getPluginRecorder().recordEvent(event)
    );

    this.variableService.initialize(initialInput.variables);

    this.variableInterpolationService = new VariableInterpolationService(() =>
      this.variableService.getVariablesWithState()
    );

    this.variableService.setInterpolationService(this.variableInterpolationService);

    if (initialInput.variables && initialInput.variables.length > 0) {
      this.variableService.refreshAllVariableOptions();
    }

    // Subscribe to variable changes and update container input
    // Use getVariablesWithoutState$() to get pure Variables (no runtime state)
    this.variableSubscriptions.push(
      this.variableService.getVariablesWithoutState$().subscribe((variables) => {
        const currentVariables = this.getInput().variables;
        // Normalize undefined and empty array for comparison to avoid unnecessary updates
        const currentNormalized = currentVariables ?? [];
        const newNormalized = variables ?? [];
        if (!isEqual(currentNormalized, newNormalized)) {
          this.updateInput({ variables });
        }
      })
    );

    // Subscribe to container input changes to update VariableService dashboardId
    this.variableSubscriptions.push(
      this.getInput$().subscribe((input) => {
        // When dashboard is saved and gets an ID, update VariableService
        if (input.id && input.id !== initialInput.id) {
          this.variableService.setDashboardId(input.id);
        }
      })
    );

    this.initVariableRefreshSubscription();
  }

  private initVariableRefreshSubscription() {
    let prevTimeRange = this.getInput().timeRange;
    let prevReloadTime = this.getInput().lastReloadRequestTime;

    this.variableSubscriptions.push(
      this.getInput$().subscribe((input) => {
        const variables = this.variableService.getVariables();
        const hasQueryVariables = variables.some((v) => v.type === 'query');
        if (!hasQueryVariables) return;

        const timeRangeChanged = !isEqual(input.timeRange, prevTimeRange);
        const reloadTriggered = input.lastReloadRequestTime !== prevReloadTime;

        if (timeRangeChanged || reloadTriggered) {
          prevTimeRange = input.timeRange;
          prevReloadTime = input.lastReloadRequestTime;

          if (reloadTriggered) {
            // Manual reload: refresh all variables
            this.variableService.refreshAllVariableOptions();
          } else if (timeRangeChanged) {
            // Only time range changed: refresh only time-filtered variables
            this.variableService.refreshTimeFilteredVariableOptions();
          }
        }
      })
    );
  }

  /**
   * SectionLayout: when a member panel is removed (the generic "Delete from
   * dashboard" action), also prune it from the section it belonged to so no
   * dangling member reference remains in the layout. GridLayout behavior is
   * unchanged.
   */
  public removeEmbeddable(embeddableId: string) {
    super.removeEmbeddable(embeddableId);
    const layout = this.input.layout;
    if (layout?.type === 'SectionLayout') {
      const items = removeMemberFromLayout(layout.items, embeddableId);
      if (!isEqual(items, layout.items)) {
        this.updateInput({ layout: { type: 'SectionLayout', items } });
      }
    }
  }

  protected createNewPanelState<
    TEmbeddableInput extends EmbeddableInput,
    TEmbeddable extends IEmbeddable<TEmbeddableInput, any>,
  >(
    factory: EmbeddableFactory<TEmbeddableInput, any, TEmbeddable>,
    partial: Partial<TEmbeddableInput> = {}
  ): DashboardPanelState<TEmbeddableInput> {
    const panelState = super.createNewPanelState(factory, partial);
    return createPanelState(panelState, this.input.panels);
  }

  public showPlaceholderUntil<TPlacementMethodArgs extends IPanelPlacementArgs>(
    newStateComplete: Promise<Partial<PanelState>>,
    placementMethod?: PanelPlacementMethod<TPlacementMethodArgs>,
    placementArgs?: TPlacementMethodArgs,
    // When the source panel lives in a section (and the sections feature is on),
    // the placeholder -- and then its replacement -- are inserted as members of
    // that section, so the new panel renders inside the section instead of the
    // read-only "Ungrouped" group. Only the clone action passes this; it is
    // self-gated on `allowDashboardSections` so other/flag-off callers are
    // unaffected.
    sectionId?: string
  ): void {
    const originalPanelState = {
      type: PLACEHOLDER_EMBEDDABLE,
      explicitInput: {
        id: uuidv4(),
        disabledActions: [
          'ACTION_CUSTOMIZE_PANEL',
          'CUSTOM_TIME_RANGE',
          'clonePanel',
          'replacePanel',
          'togglePanel',
        ],
      },
    } as PanelState<EmbeddableInput>;
    const placeholderPanelState = createPanelState(
      originalPanelState,
      this.input.panels,
      placementMethod,
      placementArgs
    );
    const placeholderId = placeholderPanelState.explicitInput.id;

    const layout = this.input.layout;
    const useSection =
      Boolean(sectionId) &&
      Boolean(this.options.allowDashboardSections) &&
      layout?.type === 'SectionLayout' &&
      layout.items.some((section) => section.id === sectionId);

    if (useSection) {
      // Insert the placeholder into panels AND as a member of the target section
      // in one update, so it appears in the section (loading) from the start.
      const appended = appendMemberToSection(layout!.items, sectionId!, placeholderId);
      this.updateInput({
        panels: { ...this.input.panels, [placeholderId]: placeholderPanelState },
        ...(appended ? { layout: { type: 'SectionLayout', items: appended.items } } : {}),
      });
    } else {
      this.updateInput({
        panels: { ...this.input.panels, [placeholderId]: placeholderPanelState },
      });
    }

    newStateComplete.then((newPanelState: Partial<PanelState>) =>
      this.replacePanel(placeholderPanelState, newPanelState)
    );
  }

  public replacePanel(
    previousPanelState: DashboardPanelState<EmbeddableInput>,
    newPanelState: Partial<PanelState>
  ) {
    // TODO: In the current infrastructure, embeddables in a container do not react properly to
    // changes. Removing the existing embeddable, and adding a new one is a temporary workaround
    // until the container logic is fixed.

    const previousId = previousPanelState.explicitInput.id;
    const finalPanels = { ...this.input.panels };
    delete finalPanels[previousId];
    const newPanelId = newPanelState.explicitInput?.id ? newPanelState.explicitInput.id : uuidv4();
    finalPanels[newPanelId] = {
      ...previousPanelState,
      ...newPanelState,
      gridData: {
        ...previousPanelState.gridData,
        i: newPanelId,
      },
      explicitInput: {
        ...newPanelState.explicitInput,
        id: newPanelId,
      },
    };

    // If the replaced panel was a member of a section, transfer that membership
    // to the replacement so it stays in the same section instead of falling into
    // the read-only "Ungrouped" group. This covers Replace panel, add/unlink
    // library, and the clone placeholder swap. GridLayout dashboards have no
    // section members, so this is a no-op for them.
    const layout = this.input.layout;
    const layoutUpdate =
      layout?.type === 'SectionLayout' &&
      layout.items.some((section) => section.members.some((m) => m.idRef === previousId))
        ? {
            layout: {
              type: 'SectionLayout' as const,
              items: layout.items.map((section) => ({
                ...section,
                members: section.members.map((member) =>
                  member.idRef === previousId ? { ...member, idRef: newPanelId } : member
                ),
              })),
            },
          }
        : {};

    this.updateInput({
      panels: finalPanels,
      lastReloadRequestTime: new Date().getTime(),
      ...layoutUpdate,
    });
  }

  public async addOrUpdateEmbeddable<
    EEI extends EmbeddableInput = EmbeddableInput,
    EEO extends EmbeddableOutput = EmbeddableOutput,
    E extends IEmbeddable<EEI, EEO> = IEmbeddable<EEI, EEO>,
  >(type: string, explicitInput: Partial<EEI>, embeddableId?: string) {
    const idToReplace = embeddableId || explicitInput.id;
    if (idToReplace && this.input.panels[idToReplace]) {
      this.replacePanel(this.input.panels[idToReplace], {
        type,
        explicitInput: {
          ...explicitInput,
          id: uuidv4(),
        },
      });
    } else {
      this.addNewEmbeddable<EEI, EEO, E>(type, explicitInput);
    }
  }

  public render(dom: HTMLElement) {
    if (!this.root) {
      this.root = createRoot(dom);
    }
    this.root.render(
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={this.options}>
          <DashboardViewport
            key={this.id}
            renderEmpty={this.renderEmpty}
            logos={this.logos}
            container={this}
            PanelComponent={this.embeddablePanel}
          />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );
  }

  public destroy() {
    super.destroy();
    this.variableSubscriptions.forEach((s) => s.unsubscribe());
    this.variableSubscriptions = [];
    this.variableService.destroy();
  }

  /**
   * Get query strings from all panel embeddables.
   * Used to detect variable references in visualizations.
   */
  public getPanelQueries(): string[] {
    const queries: string[] = [];
    for (const id of this.getChildIds()) {
      try {
        const child = this.getChild<any>(id);
        if (child?.originalQuery && typeof child.originalQuery === 'string') {
          queries.push(child.originalQuery);
        }
      } catch {
        // Skip embeddables that can't be accessed or aren't loaded yet
        continue;
      }
    }
    return queries;
  }

  /**
   * Re-parent existing panels across the dashboard's grids (Add-section,
   * Move-to-section, Ungroup) by cycling them through the container's natural
   * onPanelRemoved -> onPanelAdded lifecycle. A cross-grid React unmount
   * destroys the moving panel's embeddable (EmbeddablePanel.componentWillUnmount),
   * and the container only creates/destroys children as ids enter/leave
   * `input.panels`; so a move that merely changed the layout would leave a
   * destroyed instance cached and render blank. Instead we remove the panels
   * (onPanelRemoved destroys them + clears the cache) and immediately re-add
   * them with the final layout (onPanelAdded recreates fresh instances). The
   * two updateInput calls run synchronously back-to-back; React 18 (createRoot)
   * auto-batches them into a single commit, so there is no empty frame -- the
   * recreated panels just show their normal loading state.
   *
   * @param ids ids of the panels being re-parented (their embeddables recreate)
   * @param layout the final layout to land
   * @param panels the final panels map (defaults to the current panels)
   */
  public reparentPanels(
    ids: string[],
    layout: DashboardLayout,
    panels?: DashboardContainerInput['panels']
  ) {
    const finalPanels = panels ?? this.input.panels;
    const strippedPanels = { ...this.input.panels };
    ids.forEach((id) => delete strippedPanels[id]);
    // Phase 1: drop the panels so the container destroys their (now unmounted)
    // embeddables and clears its cache.
    this.updateInput({ panels: strippedPanels });
    // Phase 2: land the final panels + layout so the container recreates them.
    this.updateInput({ panels: finalPanels, layout });
  }

  /**
   * Transiently records which section a "Create new visualization" was launched
   * from, so it can be handed to the editor via the state-transfer round-trip
   * (see getStateTransferContainerInfoData). Set synchronously right before
   * navigating to the editor; consumed (and cleared) within the same call.
   */
  public setPendingCreateSectionContext(sectionId: string) {
    this.pendingCreateSectionId = sectionId;
  }

  /**
   * Container-owned, opaque context to round-trip through an editor. When the
   * dashboard sections flag is on and a "Create new visualization" was launched
   * from a section, this returns `{ sectionId }` so the returning panel can be
   * claimed back into that section. Consumed on read.
   */
  public getStateTransferContainerInfoData(): Record<string, unknown> | undefined {
    if (!this.options.allowDashboardSections) return undefined;
    const sectionId = this.pendingCreateSectionId;
    this.pendingCreateSectionId = undefined;
    return sectionId ? { sectionId } : undefined;
  }

  protected getInheritedInput(id: string): InheritedChildInput {
    const {
      viewMode,
      refreshConfig,
      timeRange,
      query,
      hidePanelTitles,
      filters,
      useSharedCrosshair,
    } = this.input;
    return {
      filters,
      hidePanelTitles,
      useSharedCrosshair,
      query,
      timeRange,
      refreshConfig,
      viewMode,
      id,
    };
  }
}
