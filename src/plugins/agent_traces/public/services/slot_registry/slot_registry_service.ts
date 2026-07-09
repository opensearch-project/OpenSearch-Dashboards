/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Defines the slot types and their corresponding render method signatures
 */
export interface SlotTypeDefinitions {
  resultsActionBar: {
    render: () => React.ReactElement;
  };
  // Add more slot types as needed
}

/**
 * Base configuration for a slot item
 */
interface BaseSlotItemConfig<T extends keyof SlotTypeDefinitions> {
  /**
   * The unique id for the slot item
   */
  id: string;
  /**
   * Lower order indicates higher position in the UI
   */
  order: number;
  /**
   * The type of slot this item belongs to
   */
  slotType: T;
}

/**
 * Slot item configuration with type-safe render method
 */
export type SlotItemConfig<
  T extends keyof SlotTypeDefinitions = keyof SlotTypeDefinitions
> = BaseSlotItemConfig<T> & SlotTypeDefinitions[T];

/**
 * Helper type to extract slot items for a specific slot type
 */
export type SlotItemsForType<T extends keyof SlotTypeDefinitions> = SlotItemConfig<T>;

export interface SlotRegistryServiceStart {
  /**
   * Register a slot item or a list of slot items
   * @param slotConfig - The slot item configuration(s) to register
   */
  register: <T extends keyof SlotTypeDefinitions>(
    slotConfig: SlotItemConfig<T> | Array<SlotItemConfig<T>>
  ) => void;
}

/**
 * Service for managing slot-based extensibility
 * This service allows plugins to register items for various extensible slots
 * with type-safe render methods based on the slot type
 * @experimental
 */
export class SlotRegistryService {
  private readonly registry$ = new BehaviorSubject<SlotItemConfig[]>([]);

  private addItemsToRegistry<T extends keyof SlotTypeDefinitions>(
    configs: Array<SlotItemConfig<T>>
  ) {
    const registry = this.registry$.getValue();
    const existingConfigIds = registry.map((config) => config.id);

    for (const config of configs) {
      if (existingConfigIds.includes(config.id)) {
        throw new Error(`Slot item with id "${config.id}" is already registered`);
      }
    }

    this.registry$.next([...registry, ...configs]);
  }

  public start(): SlotRegistryServiceStart {
    return {
      register: <T extends keyof SlotTypeDefinitions>(
        slotConfig: SlotItemConfig<T> | Array<SlotItemConfig<T>>
      ) => {
        this.addItemsToRegistry(Array.isArray(slotConfig) ? slotConfig : [slotConfig]);
      },
    };
  }

  /**
   * Get the list of registered slot items for a specific slot type in sorted order
   * @param slotType - The slot type to filter by
   * @returns Observable of sorted slot items for the specified type
   */
  public getSortedItems$<T extends keyof SlotTypeDefinitions>(
    slotType: T
  ): Observable<Array<SlotItemsForType<T>>> {
    return this.registry$.pipe(
      map((items) =>
        items
          .filter((item): item is SlotItemsForType<T> => item.slotType === slotType)
          .sort((a, b) => a.order - b.order)
      )
    );
  }

  /**
   * Get all registered slot items (for debugging/testing purposes)
   */
  public getAllItems$(): Observable<SlotItemConfig[]> {
    return this.registry$.asObservable();
  }
}
