/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Term } from '../types';
import { ConstantComponent } from './constant_component';

export class ParamComponent extends ConstantComponent {
  description: string | unknown;

  constructor(name: string, parent: ConstantComponent, description: string | unknown) {
    super(name, parent);
    this.description = description;
  }
  getTerms() {
    const t: Term = { name: this.name };
    if (this.description === '__flag__') {
      t.meta = 'flag';
    } else {
      t.meta = 'param';
      t.insertValue = this.name + '=';
    }
    return [t];
  }
}
