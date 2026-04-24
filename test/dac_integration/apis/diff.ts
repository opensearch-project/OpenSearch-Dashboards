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

import expect from '@osd/expect';
import { FtrProviderContext } from '../ftr_provider_context';
import { minimalDashboard, dacTestId } from '../helpers/dashboard_fixtures';
import { createSavedObject, deleteSavedObject } from '../helpers/test_utils';

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  describe('POST /api/saved_objects/_diff', () => {
    describe('new object detection', () => {
      it('should return status "new" for a non-existent object', async () => {
        const dashboard = minimalDashboard('diff-new');
        const resp = await supertest
          .post('/api/saved_objects/_diff')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: dashboard.attributes,
                references: dashboard.references,
              },
            ],
          })
          .expect(200);

        expect(resp.body).to.have.property('results');
        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be(1);
        expect(resp.body.results[0].status).to.be('new');
        expect(resp.body.results[0].type).to.be('dashboard');
        expect(resp.body.results[0].id).to.be(dashboard.id);
      });
    });

    describe('unchanged object detection', () => {
      const testId = dacTestId('diff-unchanged');

      before(async () => {
        const dashboard = minimalDashboard('diff-unchanged');
        await createSavedObject(
          supertest,
          dashboard.type,
          dashboard.id,
          dashboard.attributes,
          dashboard.references
        );
      });

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', testId);
      });

      it('should return status "unchanged" when attributes match', async () => {
        const dashboard = minimalDashboard('diff-unchanged');
        const resp = await supertest
          .post('/api/saved_objects/_diff')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: dashboard.attributes,
                references: dashboard.references,
              },
            ],
          })
          .expect(200);

        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be(1);
        expect(resp.body.results[0].status).to.be('unchanged');
      });
    });

    describe('updated object detection', () => {
      const testId = dacTestId('diff-updated');

      before(async () => {
        const dashboard = minimalDashboard('diff-updated');
        await createSavedObject(
          supertest,
          dashboard.type,
          dashboard.id,
          dashboard.attributes,
          dashboard.references
        );
      });

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', testId);
      });

      it('should return status "updated" with correct diff when title changes', async () => {
        const dashboard = minimalDashboard('diff-updated');
        const modifiedAttributes = {
          ...dashboard.attributes,
          title: 'Modified Title for Diff Test',
        };

        const resp = await supertest
          .post('/api/saved_objects/_diff')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: modifiedAttributes,
                references: dashboard.references,
              },
            ],
          })
          .expect(200);

        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be(1);
        expect(resp.body.results[0].status).to.be('updated');

        // The diff should contain information about the changed title
        const diff = resp.body.results[0].diff;
        expect(diff).to.not.be(undefined);
      });
    });

    describe('panel changes', () => {
      const testId = dacTestId('diff-panels');

      before(async () => {
        const dashboard = minimalDashboard('diff-panels');
        await createSavedObject(
          supertest,
          dashboard.type,
          dashboard.id,
          dashboard.attributes,
          dashboard.references
        );
      });

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', testId);
      });

      it('should detect added panels', async () => {
        const dashboard = minimalDashboard('diff-panels');
        const existingPanels = JSON.parse(dashboard.attributes.panelsJSON);
        const newPanel = {
          gridData: { x: 24, y: 0, w: 24, h: 15, i: 'panel_2' },
          panelIndex: 'panel_2',
          embeddableConfig: {},
          version: '3.0.0',
          type: 'visualization',
          id: dacTestId('vis-added'),
        };
        const updatedPanelsJSON = JSON.stringify([...existingPanels, newPanel]);

        const resp = await supertest
          .post('/api/saved_objects/_diff')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: {
                  ...dashboard.attributes,
                  panelsJSON: updatedPanelsJSON,
                },
                references: [
                  ...dashboard.references,
                  { type: 'visualization', id: dacTestId('vis-added'), name: 'panel_2' },
                ],
              },
            ],
          })
          .expect(200);

        expect(resp.body.results[0].status).to.be('updated');
      });

      it('should detect removed panels', async () => {
        const dashboard = minimalDashboard('diff-panels');
        const resp = await supertest
          .post('/api/saved_objects/_diff')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: {
                  ...dashboard.attributes,
                  panelsJSON: JSON.stringify([]),
                },
                references: [],
              },
            ],
          })
          .expect(200);

        expect(resp.body.results[0].status).to.be('updated');
      });
    });

    describe('nested changes', () => {
      const testId = dacTestId('diff-nested');

      before(async () => {
        const dashboard = minimalDashboard('diff-nested');
        await createSavedObject(
          supertest,
          dashboard.type,
          dashboard.id,
          dashboard.attributes,
          dashboard.references
        );
      });

      after(async () => {
        await deleteSavedObject(supertest, 'dashboard', testId);
      });

      it('should detect nested changes in optionsJSON', async () => {
        const dashboard = minimalDashboard('diff-nested');
        const resp = await supertest
          .post('/api/saved_objects/_diff')
          .set('osd-xsrf', 'true')
          .send({
            objects: [
              {
                type: dashboard.type,
                id: dashboard.id,
                attributes: {
                  ...dashboard.attributes,
                  optionsJSON: JSON.stringify({
                    hidePanelTitles: true, // changed from false
                    useMargins: false, // changed from true
                  }),
                },
                references: dashboard.references,
              },
            ],
          })
          .expect(200);

        expect(resp.body.results[0].status).to.be('updated');
        expect(resp.body.results[0].diff).to.not.be(undefined);
      });
    });
  });
}
