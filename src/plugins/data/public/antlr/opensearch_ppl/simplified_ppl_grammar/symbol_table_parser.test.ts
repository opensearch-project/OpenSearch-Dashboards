/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFieldType } from '../../../../common/index_patterns/fields/types';
import {
  PPLSymbolTableParser,
  parsePPLSymbolTable,
  getAvailableFieldsFromPPL,
  getAvailableFieldsForAutocomplete,
} from './symbol_table_parser';

describe('PPLSymbolTableParser', () => {
  let mockInitialFields: IFieldType[];
  let parser: PPLSymbolTableParser;

  beforeEach(() => {
    mockInitialFields = [
      {
        name: 'field1',
        type: 'string',
        esTypes: ['keyword'],
        aggregatable: true,
        filterable: true,
        searchable: true,
        sortable: true,
        visualizable: true,
        readFromDocValues: true,
        scripted: false,
        displayName: 'field1',
      },
      {
        name: 'field2',
        type: 'string',
        esTypes: ['keyword'],
        aggregatable: true,
        filterable: true,
        searchable: true,
        sortable: true,
        visualizable: true,
        readFromDocValues: true,
        scripted: false,
        displayName: 'field2',
      },
      {
        name: 'field3',
        type: 'number',
        esTypes: ['long'],
        aggregatable: true,
        filterable: true,
        searchable: true,
        sortable: true,
        visualizable: true,
        readFromDocValues: true,
        scripted: false,
        displayName: 'field3',
      },
      {
        name: 'field4',
        type: 'date',
        esTypes: ['date'],
        aggregatable: true,
        filterable: true,
        searchable: true,
        sortable: true,
        visualizable: true,
        readFromDocValues: true,
        scripted: false,
        displayName: 'field4',
      },
    ];

    parser = new PPLSymbolTableParser(mockInitialFields);
  });

  describe('fields command', () => {
    it('should only show fields selected in fields command for subsequent commands', () => {
      const result = parser.parseQuery('source = test-index | fields field1, field2');

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('field1');
      expect(availableFieldNames).toContain('field2');
      expect(availableFieldNames).not.toContain('field3');
      expect(availableFieldNames).not.toContain('field4');
      expect(availableFieldNames).toHaveLength(2);
    });

    it('should remove fields selected in fields command with - for subsequent commands', () => {
      const result = parser.parseQuery('source = test-index | fields - field1, field2');

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('field3');
      expect(availableFieldNames).toContain('field4');
      expect(availableFieldNames).not.toContain('field1');
      expect(availableFieldNames).not.toContain('field2');
      expect(availableFieldNames).toHaveLength(2);
    });

    it('should handle multiple fields command correctly', () => {
      const result = parser.parseQuery(
        'source = test-index | fields field1, field2, field3 | fields field1, field2'
      );

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('field1');
      expect(availableFieldNames).toContain('field2');
      expect(availableFieldNames).not.toContain('field3');
      expect(availableFieldNames).not.toContain('field4');
      expect(availableFieldNames).toHaveLength(2);
    });
  });

  describe('rename command', () => {
    it('should remove original fieldName and suggest new field name in subsequent commands', () => {
      const result = parser.parseQuery('source = test-index | rename field1 as newField1');

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('newField1');
      expect(availableFieldNames).not.toContain('field1');
      expect(availableFieldNames).toContain('field2');
      expect(availableFieldNames).toContain('field3');
      expect(availableFieldNames).toContain('field4');
    });

    it('should handle multiple rename clauses correctly', () => {
      const result = parser.parseQuery(
        'source = test-index | rename field1 as newField1, field2 as newField2'
      );

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('newField1');
      expect(availableFieldNames).toContain('newField2');
      expect(availableFieldNames).not.toContain('field1');
      expect(availableFieldNames).not.toContain('field2');
      expect(availableFieldNames).toContain('field3');
      expect(availableFieldNames).toContain('field4');
    });

    it('should preserve field properties when renaming', () => {
      const result = parser.parseQuery('source = test-index | rename field1 as newField1');

      const renamedField = Array.from(result.availableFields).find((f) => f.name === 'newField1');
      const originalField = mockInitialFields.find((f) => f.name === 'field1');

      expect(renamedField).toBeDefined();
      expect(renamedField?.type).toBe(originalField?.type);
      expect(renamedField?.esTypes).toEqual(originalField?.esTypes);
      expect(renamedField?.aggregatable).toBe(originalField?.aggregatable);
    });
  });

  describe('stats command', () => {
    it('should only show the fieldName that are referenced by as and by', () => {
      const result = parser.parseQuery('source = test-index | stats count() as counter by field1');

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('field1');
      expect(availableFieldNames).toContain('counter');
      expect(availableFieldNames).not.toContain('field2');
      expect(availableFieldNames).not.toContain('field3');
      expect(availableFieldNames).not.toContain('field4');
      expect(availableFieldNames).toHaveLength(2);
    });

    it('should handle stats with multiple aggregations and group by fields', () => {
      const result = parser.parseQuery(
        'source = test-index | stats count() as counter, avg(field3) as average by field1, field2'
      );

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('field1');
      expect(availableFieldNames).toContain('field2');
      expect(availableFieldNames).toContain('counter');
      expect(availableFieldNames).toContain('average');
      expect(availableFieldNames).not.toContain('field3');
      expect(availableFieldNames).not.toContain('field4');
      expect(availableFieldNames).toHaveLength(4);
    });

    it('should handle stats without group by clause', () => {
      const result = parser.parseQuery(
        'source = test-index | stats count() as counter, sum(field3) as total'
      );

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('counter');
      expect(availableFieldNames).toContain('total');
      expect(availableFieldNames).not.toContain('field1');
      expect(availableFieldNames).not.toContain('field2');
      expect(availableFieldNames).not.toContain('field3');
      expect(availableFieldNames).not.toContain('field4');
      expect(availableFieldNames).toHaveLength(2);
    });

    it('should create proper field type for aggregated fields', () => {
      const result = parser.parseQuery('source = test-index | stats count() as counter by field1');

      const counterField = Array.from(result.availableFields).find((f) => f.name === 'counter');

      expect(counterField).toBeDefined();
      expect(counterField?.type).toBe('number');
      expect(counterField?.esTypes).toEqual(['long', 'double']);
      expect(counterField?.aggregatable).toBe(true);
      expect(counterField?.scripted).toBe(true);
    });
  });

  describe('eval command', () => {
    it('should add calculated fields to available fields', () => {
      const result = parser.parseQuery('source = test-index | eval newField = field1 + field3');

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('newField');
      expect(availableFieldNames).toContain('field1');
      expect(availableFieldNames).toContain('field2');
      expect(availableFieldNames).toContain('field3');
      expect(availableFieldNames).toContain('field4');
      expect(availableFieldNames).toHaveLength(5);
    });

    it('should handle multiple eval clauses', () => {
      const result = parser.parseQuery(
        'source = test-index | eval newField1 = field1 + field3, newField2 = field2 * 2'
      );

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('newField1');
      expect(availableFieldNames).toContain('newField2');
      expect(availableFieldNames).toContain('field1');
      expect(availableFieldNames).toContain('field2');
      expect(availableFieldNames).toContain('field3');
      expect(availableFieldNames).toContain('field4');
      expect(availableFieldNames).toHaveLength(6);
    });

    it('should create proper field type for calculated fields', () => {
      const result = parser.parseQuery('source = test-index | eval newField = field1 + field3');

      const calculatedField = Array.from(result.availableFields).find((f) => f.name === 'newField');

      expect(calculatedField).toBeDefined();
      expect(calculatedField?.type).toBe('unknown');
      expect(calculatedField?.esTypes).toEqual(['keyword']);
      expect(calculatedField?.scripted).toBe(true);
      expect(calculatedField?.filterable).toBe(true);
    });
  });

  describe('complex command combinations', () => {
    it('should handle fields then rename correctly', () => {
      const result = parser.parseQuery(
        'source = test-index | fields field1, field2 | rename field1 as renamedField1'
      );

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('renamedField1');
      expect(availableFieldNames).toContain('field2');
      expect(availableFieldNames).not.toContain('field1');
      expect(availableFieldNames).not.toContain('field3');
      expect(availableFieldNames).not.toContain('field4');
      expect(availableFieldNames).toHaveLength(2);
    });

    it('should handle rename then fields correctly', () => {
      const result = parser.parseQuery(
        'source = test-index | rename field1 as renamedField1 | fields renamedField1, field2'
      );

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('renamedField1');
      expect(availableFieldNames).toContain('field2');
      expect(availableFieldNames).not.toContain('field1');
      expect(availableFieldNames).not.toContain('field3');
      expect(availableFieldNames).not.toContain('field4');
      expect(availableFieldNames).toHaveLength(2);
    });

    it('should handle fields then stats correctly', () => {
      const result = parser.parseQuery(
        'source = test-index | fields field1, field2, field3 | stats count() as counter by field1'
      );

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('field1');
      expect(availableFieldNames).toContain('counter');
      expect(availableFieldNames).not.toContain('field2');
      expect(availableFieldNames).not.toContain('field3');
      expect(availableFieldNames).not.toContain('field4');
      expect(availableFieldNames).toHaveLength(2);
    });

    it('should handle eval then fields correctly', () => {
      const result = parser.parseQuery(
        'source = test-index | eval newField = field1 + field3 | fields newField, field2'
      );

      const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

      expect(availableFieldNames).toContain('newField');
      expect(availableFieldNames).toContain('field2');
      expect(availableFieldNames).not.toContain('field1');
      expect(availableFieldNames).not.toContain('field3');
      expect(availableFieldNames).not.toContain('field4');
      expect(availableFieldNames).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle invalid PPL syntax gracefully', () => {
      const result = parser.parseQuery('source = test-index | invalid_command');

      expect(result.errors).toBeDefined();
      expect(Array.from(result.availableFields)).toEqual(mockInitialFields);
    });

    it('should handle empty query', () => {
      const result = parser.parseQuery('');

      expect(result.errors).toBeDefined();
      expect(Array.from(result.availableFields)).toEqual(mockInitialFields);
    });

    it('should handle malformed fields command', () => {
      const result = parser.parseQuery('source = test-index | fields');

      expect(result.errors.length).toBeGreaterThanOrEqual(0);
      expect(Array.from(result.availableFields)).toEqual(mockInitialFields);
    });
  });

  describe('utility functions', () => {
    describe('parsePPLSymbolTable', () => {
      it('should return correct symbol table state', () => {
        const result = parsePPLSymbolTable(
          'source = test-index | fields field1, field2',
          mockInitialFields
        );

        const availableFieldNames = Array.from(result.availableFields).map((f) => f.name);

        expect(availableFieldNames).toContain('field1');
        expect(availableFieldNames).toContain('field2');
        expect(availableFieldNames).toHaveLength(2);
      });
    });

    describe('getAvailableFieldsFromPPL', () => {
      it('should return available fields as array', () => {
        const result = getAvailableFieldsFromPPL(
          'source = test-index | fields field1, field2',
          mockInitialFields
        );

        const fieldNames = result.map((f) => f.name);

        expect(fieldNames).toContain('field1');
        expect(fieldNames).toContain('field2');
        expect(fieldNames).toHaveLength(2);
      });

      it('should apply filter method when provided', () => {
        const result = getAvailableFieldsFromPPL(
          'source = test-index | fields field1, field2, field3',
          mockInitialFields,
          (field) => field.type === 'string'
        );

        const fieldNames = result.map((f) => f.name);

        expect(fieldNames).toContain('field1');
        expect(fieldNames).toContain('field2');
        expect(fieldNames).not.toContain('field3'); // field3 is number type
        expect(fieldNames).toHaveLength(2);
      });
    });

    describe('getAvailableFieldsForAutocomplete', () => {
      it('should return initial fields when no complete commands', () => {
        const result = getAvailableFieldsForAutocomplete(
          'source = test-index | where ',
          25,
          mockInitialFields
        );

        const fieldNames = result.map((f) => f.name);

        expect(fieldNames).toContain('field1');
        expect(fieldNames).toContain('field2');
        expect(fieldNames).toContain('field3');
        expect(fieldNames).toContain('field4');
        expect(fieldNames).toHaveLength(4);
      });

      it('should analyze up to last complete command', () => {
        const query = 'source = test-index | fields field1, field2 | where ';
        const result = getAvailableFieldsForAutocomplete(query, query.length, mockInitialFields);

        const fieldNames = result.map((f) => f.name);

        expect(fieldNames).toContain('field1');
        expect(fieldNames).toContain('field2');
        expect(fieldNames).not.toContain('field3');
        expect(fieldNames).not.toContain('field4');
        expect(fieldNames).toHaveLength(2);
      });

      it('should handle cursor in middle of query', () => {
        const query = 'source = test-index | fields field1, field2 | where field1 = "value"';
        const cursorPosition = 45; // Right after "field2 |"
        const result = getAvailableFieldsForAutocomplete(query, cursorPosition, mockInitialFields);

        const fieldNames = result.map((f) => f.name);

        expect(fieldNames).toContain('field1');
        expect(fieldNames).toContain('field2');
        expect(fieldNames).not.toContain('field3');
        expect(fieldNames).not.toContain('field4');
        expect(fieldNames).toHaveLength(2);
      });

      it('should apply filter method when provided', () => {
        const query = 'source = test-index | fields field1, field2, field3 | where ';
        const result = getAvailableFieldsForAutocomplete(
          query,
          query.length,
          mockInitialFields,
          (field) => field.type === 'string'
        );

        const fieldNames = result.map((f) => f.name);

        expect(fieldNames).toContain('field1');
        expect(fieldNames).toContain('field2');
        expect(fieldNames).not.toContain('field3'); // field3 is number type
        expect(fieldNames).toHaveLength(2);
      });
    });
  });

  describe('getAvailableFields method', () => {
    it('should return current available fields as array', () => {
      parser.parseQuery('source = test-index | fields field1, field2');
      const result = parser.getAvailableFields();

      const fieldNames = result.map((f) => f.name);

      expect(fieldNames).toContain('field1');
      expect(fieldNames).toContain('field2');
      expect(fieldNames).toHaveLength(2);
    });
  });

  describe('symbol table state management', () => {
    it('should reset symbol table between queries', () => {
      parser.parseQuery('source = test-index | fields field1');
      let result = parser.getAvailableFields();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('field1');

      parser.parseQuery('source = test-index | fields field2');
      result = parser.getAvailableFields();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('field2');
    });

    it('should maintain initial fields when no commands modify them', () => {
      const result = parser.parseQuery('source = test-index | where field1 = "value"');

      expect(Array.from(result.availableFields)).toHaveLength(4);
      expect(Array.from(result.availableFields)).toEqual(expect.arrayContaining(mockInitialFields));
    });
  });
});
