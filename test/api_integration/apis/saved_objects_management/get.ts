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

import expect from '@osd/expect';
import { Response } from 'supertest';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService }: FtrProviderContext) {
  const opensearch = getService('legacyOpenSearch');
  const supertest = getService('supertest');
  const opensearchArchiver = getService('opensearchArchiver');

  describe('get', () => {
    const existingObject = 'visualization/dd7caf20-9efd-11e7-acb3-3dab96693fab';
    const nonexistentObject = 'wigwags/foo';

    describe('with opensearch-dashboards index', () => {
      before(() => opensearchArchiver.load('saved_objects/basic'));
      after(() => opensearchArchiver.unload('saved_objects/basic'));

      it('should return 200 for object that exists and inject metadata', async () =>
        await supertest
          .get(`/api/opensearch-dashboards/management/saved_objects/${existingObject}`)
          .expect(200)
          .then((resp: Response) => {
            const { body } = resp;
            const { type, id, meta } = body;
            expect(type).to.eql('visualization');
            expect(id).to.eql('dd7caf20-9efd-11e7-acb3-3dab96693fab');
            expect(meta).to.not.equal(undefined);
          }));

      it('should return 404 for object that does not exist', async () =>
        await supertest
          .get(`/api/opensearch-dashboards/management/saved_objects/${nonexistentObject}`)
          .expect(404));
    });

    describe('without opensearch-dashboards index', () => {
      before(
        async () =>
          // just in case the opensearch-dashboards server has recreated it
          await opensearch.indices.delete({
            index: '.kibana',
            ignore: [404],
          })
      );

      it('should return 404 for object that no longer exists', async () =>
        await supertest
          .get(`/api/opensearch-dashboards/management/saved_objects/${existingObject}`)
          .expect(404));
    });
  });
}
