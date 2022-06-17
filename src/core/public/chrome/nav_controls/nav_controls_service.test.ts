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

import { NavControlsService } from './nav_controls_service';
import { take } from 'rxjs/operators';

describe('RecentlyAccessed#start()', () => {
  const getStart = () => {
    return new NavControlsService().start();
  };

  describe('left contorols', () => {
    it('allows registration', async () => {
      const navControls = getStart();
      const nc = { mount: jest.fn() };
      navControls.registerLeft(nc);
      expect(await navControls.getLeft$().pipe(take(1)).toPromise()).toEqual([nc]);
    });

    it('sorts controls by order property', async () => {
      const navControls = getStart();
      const nc1 = { mount: jest.fn(), order: 10 };
      const nc2 = { mount: jest.fn(), order: 0 };
      const nc3 = { mount: jest.fn(), order: 20 };
      navControls.registerLeft(nc1);
      navControls.registerLeft(nc2);
      navControls.registerLeft(nc3);
      expect(await navControls.getLeft$().pipe(take(1)).toPromise()).toEqual([nc2, nc1, nc3]);
    });
  });

  describe('right controls', () => {
    it('allows registration', async () => {
      const navControls = getStart();
      const nc = { mount: jest.fn() };
      navControls.registerRight(nc);
      expect(await navControls.getRight$().pipe(take(1)).toPromise()).toEqual([nc]);
    });

    it('sorts controls by order property', async () => {
      const navControls = getStart();
      const nc1 = { mount: jest.fn(), order: 10 };
      const nc2 = { mount: jest.fn(), order: 0 };
      const nc3 = { mount: jest.fn(), order: 20 };
      navControls.registerRight(nc1);
      navControls.registerRight(nc2);
      navControls.registerRight(nc3);
      expect(await navControls.getRight$().pipe(take(1)).toPromise()).toEqual([nc2, nc1, nc3]);
    });
  });

  describe('center controls', () => {
    it('allows registration', async () => {
      const navControls = getStart();
      const nc = { mount: jest.fn() };
      navControls.registerCenter(nc);
      expect(await navControls.getCenter$().pipe(take(1)).toPromise()).toEqual([nc]);
    });

    it('sorts controls by order property', async () => {
      const navControls = getStart();
      const nc1 = { mount: jest.fn(), order: 10 };
      const nc2 = { mount: jest.fn(), order: 0 };
      const nc3 = { mount: jest.fn(), order: 20 };
      navControls.registerCenter(nc1);
      navControls.registerCenter(nc2);
      navControls.registerCenter(nc3);
      expect(await navControls.getCenter$().pipe(take(1)).toPromise()).toEqual([nc2, nc1, nc3]);
    });
  });

  describe('expanded right controls', () => {
    it('allows registration', async () => {
      const navControls = getStart();
      const nc = { mount: jest.fn() };
      navControls.registerExpandedRight(nc);
      expect(await navControls.getExpandedRight$().pipe(take(1)).toPromise()).toEqual([nc]);
    });

    it('sorts controls by order property', async () => {
      const navControls = getStart();
      const nc1 = { mount: jest.fn(), order: 10 };
      const nc2 = { mount: jest.fn(), order: 0 };
      const nc3 = { mount: jest.fn(), order: 20 };
      navControls.registerExpandedRight(nc1);
      navControls.registerExpandedRight(nc2);
      navControls.registerExpandedRight(nc3);
      expect(await navControls.getExpandedRight$().pipe(take(1)).toPromise()).toEqual([
        nc2,
        nc1,
        nc3,
      ]);
    });
  });

  describe('expanded center controls', () => {
    it('allows registration', async () => {
      const navControls = getStart();
      const nc = { mount: jest.fn() };
      navControls.registerExpandedCenter(nc);
      expect(await navControls.getExpandedCenter$().pipe(take(1)).toPromise()).toEqual([nc]);
    });

    it('sorts controls by order property', async () => {
      const navControls = getStart();
      const nc1 = { mount: jest.fn(), order: 10 };
      const nc2 = { mount: jest.fn(), order: 0 };
      const nc3 = { mount: jest.fn(), order: 20 };
      navControls.registerExpandedCenter(nc1);
      navControls.registerExpandedCenter(nc2);
      navControls.registerExpandedCenter(nc3);
      expect(await navControls.getExpandedCenter$().pipe(take(1)).toPromise()).toEqual([
        nc2,
        nc1,
        nc3,
      ]);
    });
  });
});
