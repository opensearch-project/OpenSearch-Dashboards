/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DefaultFormatEditor } from '../../components/field_editor/components/field_format_editor';

export class FieldFormatEditors {
  private editors: Array<typeof DefaultFormatEditor> = [];

  public setup(defaultFieldEditors: FieldFormatEditors['editors'] = []) {
    this.editors = defaultFieldEditors;

    return {
      register: (editor: typeof DefaultFormatEditor) => {
        this.editors.push(editor);
      },
    };
  }

  public start() {
    return {
      getAll: () => [...this.editors],
      getById: (id: string) => {
        return this.editors.find((editor) => editor.formatId === id);
      },
    };
  }
}
