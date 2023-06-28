/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { ViewDefinition } from './types';

type IView = ViewDefinition;

export class View implements IView {
  public readonly id: string;
  public readonly title: string;
  public readonly ui: IView['ui'];
  public readonly defaultPath: string;
  public readonly appExtentions: IView['appExtentions'];
  readonly shouldShow?: (state: any) => boolean;

  constructor(options: ViewDefinition) {
    this.id = options.id;
    this.title = options.title;
    this.ui = options.ui;
    this.defaultPath = options.defaultPath;
    this.appExtentions = options.appExtentions;
    this.shouldShow = options.shouldShow;
  }
}
