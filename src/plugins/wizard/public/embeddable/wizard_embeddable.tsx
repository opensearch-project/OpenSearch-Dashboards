/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Subscription } from 'rxjs';

import { WizardSavedObjectAttributes } from '../../common';
import {
  Embeddable,
  EmbeddableOutput,
  IContainer,
  SavedObjectEmbeddableInput,
} from '../../../embeddable/public';
import { IToasts, SavedObjectsClientContract } from '../../../../core/public';
import { WizardEmbeddableComponent } from './wizard_component';
import { ReactExpressionRendererType } from '../../../expressions/public';
import { TypeServiceStart } from '../services/type_service';
import { DataPublicPluginStart } from '../../../data/public';

export const WIZARD_EMBEDDABLE = 'WIZARD_EMBEDDABLE';

export interface WizardOutput extends EmbeddableOutput {
  /**
   * Will contain the saved object attributes of the Wizard Saved Object that matches
   * `input.savedObjectId`. If the id is invalid, this may be undefined.
   */
  savedAttributes?: WizardSavedObjectAttributes;
}

export class WizardEmbeddable extends Embeddable<SavedObjectEmbeddableInput, WizardOutput> {
  public readonly type = WIZARD_EMBEDDABLE;
  private subscription: Subscription;
  private node?: HTMLElement;
  private savedObjectsClient: SavedObjectsClientContract;
  public ReactExpressionRenderer: ReactExpressionRendererType;
  public toasts: IToasts;
  public types: TypeServiceStart;
  public indexPatterns: DataPublicPluginStart['indexPatterns'];
  public aggs: DataPublicPluginStart['search']['aggs'];
  private savedObjectId?: string;

  constructor(
    initialInput: SavedObjectEmbeddableInput,
    {
      parent,
      savedObjectsClient,
      data,
      ReactExpressionRenderer,
      toasts,
      types,
    }: {
      parent?: IContainer;
      data: DataPublicPluginStart;
      savedObjectsClient: SavedObjectsClientContract;
      ReactExpressionRenderer: ReactExpressionRendererType;
      toasts: IToasts;
      types: TypeServiceStart;
    }
  ) {
    // TODO: can default title come from saved object?
    super(initialInput, { defaultTitle: 'wizard' }, parent);
    this.savedObjectsClient = savedObjectsClient;
    this.ReactExpressionRenderer = ReactExpressionRenderer;
    this.toasts = toasts;
    this.types = types;
    this.indexPatterns = data.indexPatterns;
    this.aggs = data.search.aggs;

    this.subscription = this.getInput$().subscribe(async () => {
      // There is a little more work today for this embeddable because it has
      // more output it needs to update in response to input state changes.
      let savedAttributes: WizardSavedObjectAttributes | undefined;

      // Since this is an expensive task, we save a local copy of the previous
      // savedObjectId locally and only retrieve the new saved object if the id
      // actually changed.
      if (this.savedObjectId !== this.input.savedObjectId) {
        this.savedObjectId = this.input.savedObjectId;
        const wizardSavedObject = await this.savedObjectsClient.get<WizardSavedObjectAttributes>(
          'wizard',
          this.input.savedObjectId
        );
        savedAttributes = wizardSavedObject?.attributes;
      }

      this.updateOutput({
        savedAttributes,
        title: savedAttributes?.title,
      });
    });
  }

  public render(node: HTMLElement) {
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    this.node = node;
    ReactDOM.render(<WizardEmbeddableComponent embeddable={this} />, node);
  }

  /**
   * Lets re-sync our saved object to make sure it's up to date!
   */
  public async reload() {
    this.savedObjectId = this.input.savedObjectId;
    const wizardSavedObject = await this.savedObjectsClient.get<WizardSavedObjectAttributes>(
      'wizard',
      this.input.savedObjectId
    );
    const savedAttributes = wizardSavedObject?.attributes;
    this.updateOutput({
      savedAttributes,
      title: wizardSavedObject?.attributes?.title,
    });
  }

  public destroy() {
    super.destroy();
    this.subscription.unsubscribe();
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
  }
}
