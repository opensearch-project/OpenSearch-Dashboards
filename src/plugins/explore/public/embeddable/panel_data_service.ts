/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantAction } from 'src/plugins/context_provider/public';

export const FETCH_PANEL_DATA_TOOL_NAME = 'fetch_panel_data';

interface PanelDataEntry {
  rows: any[];
  panelTitle: string;
}

type RegisterAction = (action: AssistantAction<any>) => void;
type UnregisterAction = (id: string) => void;

/**
 * Global singleton that owns the shared panel-data store.
 * fetch_panel_data tool is shared among all panels and it takes a
 * savedObjectId argument and looks the panel up in the store
 */
export class PanelDataService {
  private static instance: PanelDataService | null = null;

  private readonly store = new Map<string, PanelDataEntry>();
  private toolRegistered = false;

  private registerAction: RegisterAction | undefined;
  private unregisterAction: UnregisterAction | undefined;

  private constructor() {}

  static init(registerAction: RegisterAction, unregisterAction: UnregisterAction) {
    PanelDataService.instance = new PanelDataService();
    PanelDataService.instance.registerAction = registerAction;
    PanelDataService.instance.unregisterAction = unregisterAction;
  }

  static getInstance(): PanelDataService {
    if (!PanelDataService.instance) {
      throw new Error(
        'PanelDataService has not been initialized. Call PanelDataService.init() first.'
      );
    }
    return PanelDataService.instance;
  }

  setPanelData(savedObjectId: string, entry: PanelDataEntry) {
    this.store.set(savedObjectId, entry);
    this.registerTool();
  }

  removePanelData(savedObjectId: string) {
    this.store.delete(savedObjectId);
  }

  reset() {
    this.store.clear();
    this.unregisterTool();
  }

  private registerTool() {
    if (this.toolRegistered || !this.registerAction) return;
    this.toolRegistered = true;

    this.registerAction({
      name: FETCH_PANEL_DATA_TOOL_NAME,
      description:
        'Retrieves the underlying data rows from a dashboard panel by its saved object ID. ' +
        'IMPORTANT: Do NOT call this tool for general questions like "summarize this", "what does this show", or "explain the chart" — ' +
        'use the screenshot and visualization context already provided in the conversation for those. ' +
        'ONLY call this tool when the user explicitly asks for specific data that requires exact values. ',
      parameters: {
        type: 'object',
        properties: {
          savedObjectId: {
            type: 'string',
            description: 'The saved explore object ID of the panel to fetch data from',
          },
        },
        required: ['savedObjectId'],
      },
      handler: async (args: { savedObjectId: string }) => {
        const entry = this.store.get(args.savedObjectId);
        if (!entry) {
          return {
            success: false,
            message: `No data available for panel ${args.savedObjectId}. The panel may not be loaded yet.`,
          };
        }

        const formattedRows = entry.rows.map((hit: any) => hit._source || hit.fields || hit);
        return {
          success: true,
          panelTitle: entry.panelTitle,
          savedObjectId: args.savedObjectId,
          rowCount: formattedRows.length,
          rows: formattedRows,
        };
      },
    });
  }

  private unregisterTool() {
    if (!this.toolRegistered || !this.unregisterAction) return;
    this.toolRegistered = false;
    this.unregisterAction(FETCH_PANEL_DATA_TOOL_NAME);
  }
}
