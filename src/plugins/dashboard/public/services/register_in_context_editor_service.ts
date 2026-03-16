/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScopedHistory, MountPoint } from 'opensearch-dashboards/public';
import { BehaviorSubject } from 'rxjs';

/**
 * Defines the editor types and their corresponding render method signatures
 */
export interface EditorTypeDefinitions {
  exploreEditor: {
    render: () => React.ComponentType<{
      exploreId?: string;
      history: ScopedHistory;
      setHeaderActionMenu: (menuMount: MountPoint | undefined) => void;
    }>;
  };
  // TODO add visualization in-context editor if needed
}

interface BaseEditorConfig<T extends keyof EditorTypeDefinitions> {
  editorType: T;
}

export type EditorItemConfig<T extends keyof EditorTypeDefinitions> = BaseEditorConfig<T> &
  EditorTypeDefinitions[T];

export interface EditorRegistryServiceStart {
  /**
   * Register an editor. Only one editor per type is allowed.
   * If an editor with the same type exists, it will be overridden.
   * @param editor - The editor configuration to register
   */
  register: <T extends keyof EditorTypeDefinitions>(editor: EditorItemConfig<T>) => void;

  /**
   * Get registered editor by editor type
   * @param editorType - The editor type to retrieve
   */
  getEditor: <T extends keyof EditorTypeDefinitions>(
    editorType: T
  ) => EditorItemConfig<T> | undefined;
}

export class EditorRegistryService {
  private readonly registry$ = new BehaviorSubject<
    Map<keyof EditorTypeDefinitions, EditorItemConfig<keyof EditorTypeDefinitions>>
  >(new Map());

  private addToRegistry<T extends keyof EditorTypeDefinitions>(config: EditorItemConfig<T>) {
    const registry = new Map(this.registry$.getValue());
    registry.set(config.editorType, config);
    this.registry$.next(registry);
  }

  public start(): EditorRegistryServiceStart {
    return {
      register: <T extends keyof EditorTypeDefinitions>(editor: EditorItemConfig<T>) => {
        this.addToRegistry(editor);
      },

      getEditor: <T extends keyof EditorTypeDefinitions>(editorType: T) => {
        return this.registry$.getValue().get(editorType) as EditorItemConfig<T> | undefined;
      },
    };
  }
}
