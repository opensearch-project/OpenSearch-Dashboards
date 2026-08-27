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
import { i18n } from '@osd/i18n';
import { EUI_MODAL_CONFIRM_BUTTON } from '@elastic/eui';
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
import { DASHBOARD_CONTAINER_TYPE, SECTION_HEADER_ROWS } from './dashboard_constants';
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
import { DASHBOARD_SECTION_EMBEDDABLE, DashboardSectionEmbeddableInput } from './section';

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
   * Section support (Option 1): "Delete from dashboard" on a section is the
   * generic embeddable remove action; it has no section awareness and no
   * confirmation. We intercept it here (the dashboard-scoped layer) so that
   * removing a section removes the SECTION AND ITS MEMBER PANELS together,
   * behind a confirmation dialog. Removing any non-section panel delegates to
   * the base implementation unchanged.
   *
   * (Contrast with `ungroupSection`, wired to the "Ungroup section" action,
   * which removes only the section and keeps the members on the dashboard.)
   *
   * The confirm is async while the base `removeEmbeddable` contract is sync +
   * void, so we fire-and-forget: the only callers that remove a section are
   * user-initiated actions (the generic delete + the ungroup action, which
   * calls `ungroupSection` directly), so there is no programmatic path that
   * would surface an unexpected dialog.
   */
  public removeEmbeddable(embeddableId: string) {
    const panelToRemove = this.input.panels[embeddableId];
    if (!panelToRemove || panelToRemove.type !== DASHBOARD_SECTION_EMBEDDABLE) {
      super.removeEmbeddable(embeddableId);
      return;
    }
    this.confirmAndDeleteSection(embeddableId);
  }

  /**
   * Confirm, then delete the section AND all of its member panels from the
   * dashboard. Used by the generic "Delete from dashboard" action on a section.
   */
  private async confirmAndDeleteSection(embeddableId: string) {
    const panelToRemove = this.input.panels[embeddableId];
    if (!panelToRemove || panelToRemove.type !== DASHBOARD_SECTION_EMBEDDABLE) {
      return;
    }
    const members =
      (panelToRemove.explicitInput as Partial<DashboardSectionEmbeddableInput>).members ?? [];
    const memberCount = members.filter((m) => Boolean(this.input.panels[m.id])).length;

    const confirmed = await this.options.overlays.openConfirm(
      i18n.translate('dashboard.section.delete.confirmDescription', {
        defaultMessage:
          'This removes the section and its {memberCount, plural, one {# panel} other {# panels}}. This cannot be undone.',
        values: { memberCount },
      }),
      {
        title: i18n.translate('dashboard.section.delete.confirmTitle', {
          defaultMessage: 'Delete section and its panels?',
        }),
        confirmButtonText: i18n.translate('dashboard.section.delete.confirmButtonLabel', {
          defaultMessage: 'Delete',
        }),
        cancelButtonText: i18n.translate('dashboard.section.delete.cancelButtonLabel', {
          defaultMessage: 'Cancel',
        }),
        buttonColor: 'danger',
        defaultFocusedButton: EUI_MODAL_CONFIRM_BUTTON,
      }
    );

    if (!confirmed) {
      return;
    }

    const panels = { ...this.input.panels };
    // Remove every member panel, then the section itself.
    members.forEach((m) => {
      delete panels[m.id];
    });
    delete panels[embeddableId];
    this.updateInput({ panels });
  }

  /**
   * Section support (Option 1): "Ungroup section" removes the section but LEAVES
   * its members on the dashboard, where they visually were -- not teleported.
   *
   * Under Option 1 a member's own gridData is its ABSOLUTE "home" (its position
   * before it joined the section) -- its in-section position lives in the
   * section's explicitInput.members (SECTION-RELATIVE). If we just dropped the
   * section panel, each member would fall back to its stale home and jump away
   * from where it was rendered. So on ungroup we CONVERT each member's
   * section-relative layout to an absolute position at the section's own
   * location (sectionY + header rows + memberY) and write it into the member's
   * gridData, then remove the section -- the members stay put and the outer
   * grid's vertical compaction closes the vacated header gap.
   */
  public ungroupSection(embeddableId: string) {
    const panelToRemove = this.input.panels[embeddableId];
    if (!panelToRemove || panelToRemove.type !== DASHBOARD_SECTION_EMBEDDABLE) {
      return;
    }

    // Section-relative member layout -> absolute at the section's rendered
    // location. SECTION_HEADER_ROWS (shared constant) offsets past the header
    // strip so released members land where they visually sat.
    const sectionY = panelToRemove.gridData.y;
    const members =
      (panelToRemove.explicitInput as Partial<DashboardSectionEmbeddableInput>).members ?? [];

    const panels = { ...this.input.panels };
    members.forEach((m) => {
      const memberPanel = panels[m.id];
      if (!memberPanel) return;
      panels[m.id] = {
        ...memberPanel,
        gridData: {
          ...memberPanel.gridData,
          // Section-relative -> absolute at the section's rendered location.
          x: m.gridData.x,
          y: sectionY + SECTION_HEADER_ROWS + m.gridData.y,
          w: m.gridData.w,
          h: m.gridData.h,
        },
      };
    });

    delete panels[embeddableId];
    this.updateInput({ panels });
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
    placementArgs?: TPlacementMethodArgs
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
    this.updateInput({
      panels: {
        ...this.input.panels,
        [placeholderPanelState.explicitInput.id]: placeholderPanelState,
      },
    });
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

    const finalPanels = { ...this.input.panels };
    delete finalPanels[previousPanelState.explicitInput.id];
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
    this.updateInput({
      panels: finalPanels,
      lastReloadRequestTime: new Date().getTime(),
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
