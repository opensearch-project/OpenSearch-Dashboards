/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SlotRegistryService, SlotItemConfig } from './slot_registry_service';
import { take } from 'rxjs/operators';

describe('SlotRegistryService', () => {
  let service: SlotRegistryService;

  beforeEach(() => {
    service = new SlotRegistryService();
  });

  it('registers and retrieves slot items', (done) => {
    const setup = service.setup();
    const slotItems: Array<SlotItemConfig<'resultsActionBar'>> = [
      {
        id: 'test-action-bar-1',
        order: 1,
        slotType: 'resultsActionBar',
        render: () => null as any,
      },
      {
        id: 'test-action-bar-2',
        order: 2,
        slotType: 'resultsActionBar',
        render: () => null as any,
      },
    ];

    setup.register(slotItems);

    service
      .getAllItems$()
      .pipe(take(1))
      .subscribe((items) => {
        expect(items).toHaveLength(2);
        expect(items[0]).toEqual(slotItems[0]);
        expect(items[1]).toEqual(slotItems[1]);
        done();
      });
  });

  it('throws error when registering duplicate slot item id', () => {
    const setup = service.setup();
    const slotItem: SlotItemConfig<'resultsActionBar'> = {
      id: 'duplicate-id',
      order: 1,
      slotType: 'resultsActionBar',
      render: () => null as any,
    };

    setup.register(slotItem);

    expect(() => {
      setup.register(slotItem);
    }).toThrow('Slot item with id "duplicate-id" is already registered');
  });

  it('filters and sorts items by slot type', (done) => {
    const setup = service.setup();
    const actionBarItem: SlotItemConfig<'resultsActionBar'> = {
      id: 'test-action-bar',
      order: 20,
      slotType: 'resultsActionBar',
      render: () => null as any,
    };
    const cellItem: SlotItemConfig<'resultsFirstColumnCell'> = {
      id: 'test-cell',
      order: 1,
      slotType: 'resultsFirstColumnCell',
      render: (sourceData: Record<string, unknown>) => null as any,
    };
    const anotherActionBarItem: SlotItemConfig<'resultsActionBar'> = {
      id: 'another-action-bar',
      order: 10,
      slotType: 'resultsActionBar',
      render: () => null as any,
    };

    setup.register([actionBarItem, cellItem, anotherActionBarItem]);

    service
      .getSortedItems$('resultsActionBar')
      .pipe(take(1))
      .subscribe((items) => {
        expect(items).toHaveLength(2);
        expect(items[0].id).toBe('another-action-bar');
        expect(items[1].id).toBe('test-action-bar');
        done();
      });
  });

  it('handles negative order values correctly', (done) => {
    const setup = service.setup();
    const items: Array<SlotItemConfig<'resultsActionBar'>> = [
      {
        id: 'item-1',
        order: 10,
        slotType: 'resultsActionBar',
        render: () => null as any,
      },
      {
        id: 'item-2',
        order: -5,
        slotType: 'resultsActionBar',
        render: () => null as any,
      },
      {
        id: 'item-3',
        order: 0,
        slotType: 'resultsActionBar',
        render: () => null as any,
      },
    ];

    setup.register(items);

    service
      .getSortedItems$('resultsActionBar')
      .pipe(take(1))
      .subscribe((sortedItems) => {
        expect(sortedItems).toHaveLength(3);
        expect(sortedItems[0].id).toBe('item-2');
        expect(sortedItems[1].id).toBe('item-3');
        expect(sortedItems[2].id).toBe('item-1');
        done();
      });
  });

  it('emits updates when new items are registered', (done) => {
    const setup = service.setup();
    const emissions: Array<Array<SlotItemConfig<'resultsActionBar'>>> = [];

    const subscription = service.getSortedItems$('resultsActionBar').subscribe((items) => {
      emissions.push(items);

      if (emissions.length === 3) {
        expect(emissions[0]).toHaveLength(0);
        expect(emissions[1]).toHaveLength(1);
        expect(emissions[2]).toHaveLength(2);
        subscription.unsubscribe();
        done();
      }
    });

    setTimeout(() => {
      setup.register({
        id: 'item-1',
        order: 1,
        slotType: 'resultsActionBar',
        render: () => null as any,
      });
    }, 10);

    setTimeout(() => {
      setup.register({
        id: 'item-2',
        order: 2,
        slotType: 'resultsActionBar',
        render: () => null as any,
      });
    }, 20);
  });

  it('enforces correct render method signatures for different slot types', () => {
    const setup = service.setup();
    const actionBarItem: SlotItemConfig<'resultsActionBar'> = {
      id: 'test-action-bar',
      order: 1,
      slotType: 'resultsActionBar',
      render: () => null as any,
    };
    const cellItem: SlotItemConfig<'resultsFirstColumnCell'> = {
      id: 'test-cell',
      order: 1,
      slotType: 'resultsFirstColumnCell',
      render: (sourceData: Record<string, unknown>) => null as any,
    };

    expect(() => setup.register(actionBarItem)).not.toThrow();
    expect(() => setup.register(cellItem)).not.toThrow();
  });
});
