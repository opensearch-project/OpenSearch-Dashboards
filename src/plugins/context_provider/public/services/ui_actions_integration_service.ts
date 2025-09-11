/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { UiActionsSetup, UiActionsStart } from '../../../../plugins/ui_actions/public';

// Custom triggers for context capture
export const TABLE_ROW_SELECT_TRIGGER = 'TABLE_ROW_SELECT_TRIGGER';
export const EMBEDDABLE_PANEL_HOVER_TRIGGER = 'EMBEDDABLE_PANEL_HOVER_TRIGGER';
export const FILTER_APPLIED_TRIGGER = 'FILTER_APPLIED_TRIGGER';

export class UIActionsIntegrationService {
  private contextCaptureCallback?: (trigger: string, data: any) => void;
  private lastHoveredPanel: string | null = null;
  private hoverDebounceTimeout: NodeJS.Timeout | null = null;

  constructor(private uiActionsSetup: UiActionsSetup) {}

  public setup(): void {
    console.log('🔧 UI Actions Integration Service Setup');
    this.registerCustomTriggers();
    this.registerContextCaptureActions();
  }

  public start(uiActionsStart: UiActionsStart): void {
    console.log('🚀 UI Actions Integration Service Start');
    this.setupDOMEventListeners();
  }

  public setContextCaptureCallback(callback: (trigger: string, data: any) => void): void {
    this.contextCaptureCallback = callback;
  }

  private registerCustomTriggers(): void {
    console.log('📝 Registering custom triggers');

    // Register table row selection trigger
    this.uiActionsSetup.registerTrigger({
      id: TABLE_ROW_SELECT_TRIGGER as any,
      title: 'Table row selection',
      description: 'Triggered when a table row is selected in Discover',
    });

    // Register embeddable panel hover trigger
    this.uiActionsSetup.registerTrigger({
      id: EMBEDDABLE_PANEL_HOVER_TRIGGER as any,
      title: 'Embeddable panel hover',
      description: 'Triggered when hovering over an embeddable panel',
    });

    // Register filter applied trigger
    this.uiActionsSetup.registerTrigger({
      id: FILTER_APPLIED_TRIGGER as any,
      title: 'Filter applied',
      description: 'Triggered when a filter is applied',
    });
  }

  private registerContextCaptureActions(): void {
    console.log('🎯 Registering context capture actions');

    // Table row selection action
    this.uiActionsSetup.registerAction({
      id: 'CAPTURE_TABLE_ROW_CONTEXT',
      type: TABLE_ROW_SELECT_TRIGGER as any,
      getDisplayName: () => 'Capture Table Row Context',
      execute: async (context: any) => {
        console.log('📊 Table row selected:', context);
        if (this.contextCaptureCallback) {
          this.contextCaptureCallback(TABLE_ROW_SELECT_TRIGGER, {
            rowData: context.rowData,
            rowIndex: context.rowIndex,
            tableState: context.tableState,
            timestamp: Date.now(),
          });
        }
      },
    });

    // Embeddable panel hover action
    this.uiActionsSetup.registerAction({
      id: 'CAPTURE_PANEL_HOVER_CONTEXT',
      type: EMBEDDABLE_PANEL_HOVER_TRIGGER as any,
      getDisplayName: () => 'Capture Panel Hover Context',
      execute: async (context: any) => {
        console.log('🎯 Panel hovered:', context);
        if (this.contextCaptureCallback) {
          this.contextCaptureCallback(EMBEDDABLE_PANEL_HOVER_TRIGGER, {
            embeddableId: context.embeddable?.id,
            embeddableType: context.embeddable?.type,
            panelTitle: context.embeddable?.getTitle?.(),
            timestamp: Date.now(),
          });
        }
      },
    });

    // Filter applied action
    this.uiActionsSetup.registerAction({
      id: 'CAPTURE_FILTER_CONTEXT',
      type: FILTER_APPLIED_TRIGGER as any,
      getDisplayName: () => 'Capture Filter Context',
      execute: async (context: any) => {
        console.log('🔍 Filter applied:', context);
        if (this.contextCaptureCallback) {
          this.contextCaptureCallback(FILTER_APPLIED_TRIGGER, {
            filter: context.filter,
            filterType: context.filterType,
            timestamp: Date.now(),
          });
        }
      },
    });

    // Attach actions to triggers
    this.uiActionsSetup.attachAction(TABLE_ROW_SELECT_TRIGGER as any, 'CAPTURE_TABLE_ROW_CONTEXT');
    this.uiActionsSetup.attachAction(
      EMBEDDABLE_PANEL_HOVER_TRIGGER as any,
      'CAPTURE_PANEL_HOVER_CONTEXT'
    );
    this.uiActionsSetup.attachAction(FILTER_APPLIED_TRIGGER as any, 'CAPTURE_FILTER_CONTEXT');
  }

  private setupDOMEventListeners(): void {
    console.log('👂 Setting up DOM event listeners');

    // Listen for table row clicks in Discover
    this.setupTableRowClickListener();

    // Listen for embeddable panel hovers
    this.setupEmbeddablePanelHoverListener();
  }

  private setupTableRowClickListener(): void {
    // Use event delegation to capture table row clicks
    document.addEventListener(
      'click',
      (event: MouseEvent) => {
        const target = event.target;

        // Ensure target is an HTMLElement before calling closest
        if (!target || !(target instanceof HTMLElement)) {
          return;
        }

        // Check if click is on a table row in Discover
        const tableRow = target.closest('tr[data-test-subj="docTableRow"]');
        if (tableRow) {
          console.log('🔍 Table row clicked detected');

          // Extract row data
          const rowIndex = Array.from(tableRow.parentElement?.children || []).indexOf(tableRow);
          const cells = tableRow.querySelectorAll('td');
          const rowData: Record<string, any> = {};

          cells.forEach((cell, index) => {
            const fieldName = cell.getAttribute('data-test-subj') || `field_${index}`;
            rowData[fieldName] = cell.textContent?.trim() || '';
          });

          // Trigger the UI Action
          if (this.contextCaptureCallback) {
            this.contextCaptureCallback(TABLE_ROW_SELECT_TRIGGER, {
              rowData,
              rowIndex,
              tableState: {
                totalRows: tableRow.parentElement?.children.length || 0,
                selectedRow: rowIndex,
              },
              timestamp: Date.now(),
            });
          }
        }
      },
      { capture: true }
    );
  }

  private setupEmbeddablePanelHoverListener(): void {
    // Listen for mouse enter events on embeddable panels
    document.addEventListener(
      'mouseenter',
      (event: MouseEvent) => {
        const target = event.target;

        // Ensure target is an HTMLElement before calling closest
        if (!target || !(target instanceof HTMLElement)) {
          return;
        }

        // Check if hover is on an embeddable panel
        const embeddablePanel = target.closest('[data-test-subj="embeddablePanel"]');
        if (embeddablePanel) {
          const panelId = embeddablePanel.getAttribute('data-embeddable-id');

          // Debounce and avoid duplicate triggers for the same panel
          if (panelId === this.lastHoveredPanel) {
            return;
          }

          // Clear previous timeout
          if (this.hoverDebounceTimeout) {
            clearTimeout(this.hoverDebounceTimeout);
          }

          this.lastHoveredPanel = panelId;

          // Debounce the hover event
          this.hoverDebounceTimeout = setTimeout(() => {
            console.log('🎯 Embeddable panel hover detected');

            // Extract panel information
            const panelTitle = embeddablePanel
              .querySelector('[data-test-subj="dashboardPanelTitle"]')
              ?.textContent?.trim();

            // Trigger the UI Action
            if (this.contextCaptureCallback) {
              this.contextCaptureCallback(EMBEDDABLE_PANEL_HOVER_TRIGGER, {
                embeddableId: panelId,
                panelTitle,
                panelElement: embeddablePanel,
                timestamp: Date.now(),
              });
            }
          }, 100); // 100ms debounce
        }
      },
      { capture: true }
    );

    // Reset hover state when mouse leaves
    document.addEventListener(
      'mouseleave',
      (event: MouseEvent) => {
        const target = event.target;

        if (!target || !(target instanceof HTMLElement)) {
          return;
        }

        const embeddablePanel = target.closest('[data-test-subj="embeddablePanel"]');
        if (embeddablePanel) {
          const panelId = embeddablePanel.getAttribute('data-embeddable-id');
          if (panelId === this.lastHoveredPanel) {
            this.lastHoveredPanel = null;
          }
        }
      },
      { capture: true }
    );
  }

  // Method to manually trigger context capture (for testing)
  public triggerContextCapture(triggerType: string, data: any): void {
    console.log(`🧪 Manually triggering context capture: ${triggerType}`, data);
    console.log('🔥 DEBUG: contextCaptureCallback exists:', !!this.contextCaptureCallback);

    if (this.contextCaptureCallback) {
      console.log('🔥 DEBUG: Calling contextCaptureCallback');
      this.contextCaptureCallback(triggerType, data);
      console.log('🔥 DEBUG: contextCaptureCallback called successfully');
    } else {
      console.error('🔥 DEBUG: contextCaptureCallback is not set!');
    }
  }
}
