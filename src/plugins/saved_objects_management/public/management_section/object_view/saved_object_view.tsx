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

import React, { Component } from 'react';
import { i18n } from '@osd/i18n';
import { EuiSpacer, EuiPageContent } from '@elastic/eui';
import {
  Capabilities,
  SavedObjectsClientContract,
  OverlayStart,
  NotificationsStart,
  SimpleSavedObject,
  ScopedHistory,
} from '../../../../../core/public';
import { ISavedObjectsManagementServiceRegistry } from '../../services';
import { Header, NotFoundErrors, Intro, Form } from './components';
import { canViewInApp } from '../../lib';
import { SubmittedFormData } from '../types';
import { UiActionsStart } from '../../../../ui_actions/public';
import { SAVED_OBJECT_DELETE_TRIGGER } from '../../triggers';

interface SavedObjectEditionProps {
  id: string;
  serviceName: string;
  serviceRegistry: ISavedObjectsManagementServiceRegistry;
  capabilities: Capabilities;
  overlays: OverlayStart;
  notifications: NotificationsStart;
  uiActions: UiActionsStart;
  notFoundType?: string;
  savedObjectsClient: SavedObjectsClientContract;
  history: ScopedHistory;
}

interface SavedObjectEditionState {
  type: string;
  object?: SimpleSavedObject<any>;
}

export class SavedObjectEdition extends Component<
  SavedObjectEditionProps,
  SavedObjectEditionState
> {
  constructor(props: SavedObjectEditionProps) {
    super(props);

    const { serviceRegistry, serviceName } = props;
    const type = serviceRegistry.get(serviceName)!.service.type;

    this.state = {
      object: undefined,
      type,
    };
  }

  componentDidMount() {
    const { id, savedObjectsClient } = this.props;
    const { type } = this.state;
    savedObjectsClient.get(type, id).then((object) => {
      this.setState({
        object,
      });
    });
  }

  render() {
    const {
      capabilities,
      notFoundType,
      serviceRegistry,
      id,
      serviceName,
      savedObjectsClient,
    } = this.props;
    const { type } = this.state;
    const { object } = this.state;
    const { edit: canEdit, delete: canDelete } = capabilities.savedObjectsManagement as Record<
      string,
      boolean
    >;
    const canView = canViewInApp(capabilities, type);
    const service = serviceRegistry.get(serviceName)!.service;

    return (
      <EuiPageContent horizontalPosition="center" data-test-subj="savedObjectsEdit">
        <Header
          canEdit={canEdit}
          canDelete={canDelete}
          canViewInApp={canView}
          type={type}
          onDeleteClick={() => this.delete()}
          viewUrl={service.urlFor(id)}
        />
        {notFoundType && (
          <>
            <EuiSpacer size="s" />
            <NotFoundErrors type={notFoundType} />
          </>
        )}
        {canEdit && (
          <>
            <EuiSpacer size="s" />
            <Intro />
          </>
        )}
        {object && (
          <>
            <EuiSpacer size="m" />
            <Form
              object={object}
              savedObjectsClient={savedObjectsClient}
              service={service}
              editionEnabled={canEdit}
              onSave={this.saveChanges}
            />
          </>
        )}
      </EuiPageContent>
    );
  }

  async delete() {
    const { id, savedObjectsClient, overlays, notifications } = this.props;
    const { type, object } = this.state;

    const confirmed = await overlays.openConfirm(
      i18n.translate('savedObjectsManagement.deleteConfirm.modalDescription', {
        defaultMessage: 'This action permanently removes the object from OpenSearch Dashboards.',
      }),
      {
        confirmButtonText: i18n.translate(
          'savedObjectsManagement.deleteConfirm.modalDeleteButtonLabel',
          {
            defaultMessage: 'Delete',
          }
        ),
        title: i18n.translate('savedObjectsManagement.deleteConfirm.modalTitle', {
          defaultMessage: `Delete '{title}'?`,
          values: {
            title: object?.attributes?.title || 'saved OpenSearch Dashboards object',
          },
        }),
        buttonColor: 'danger',
      }
    );
    // TODO: This trigger should be maintained and emitted by the saved objects plugin
    // when an obj is deleted. Tracking issue:
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4499
    if (confirmed) {
      this.props.uiActions
        .getTrigger(SAVED_OBJECT_DELETE_TRIGGER)
        .exec({ type, savedObjectId: id });
      await savedObjectsClient.delete(type, id);

      notifications.toasts.addSuccess(`Deleted ${this.formatTitle(object)} ${type} object`);
      this.redirectToListing();
    }
  }

  saveChanges = async ({ attributes, references }: SubmittedFormData) => {
    const { savedObjectsClient, notifications } = this.props;
    const { object, type } = this.state;

    await savedObjectsClient.update(object!.type, object!.id, attributes, { references });
    notifications.toasts.addSuccess(`Updated ${this.formatTitle(object)} ${type} object`);
    this.redirectToListing();
  };

  formatTitle = (object: SimpleSavedObject<any> | undefined) => {
    return object?.attributes?.title ?? '';
  };

  redirectToListing() {
    this.props.history.push('/');
  }
}
