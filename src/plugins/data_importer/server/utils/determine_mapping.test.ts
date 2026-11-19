/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import { determineMapping, determineMappingFromDocuments } from './determine_mapping';

describe('determine_mapping', () => {
  describe('determineType()', () => {
    const document = {
      metadata: {
        id: 'abc-123',
        created_at: '2025-02-04T12:34:56Z',
        updated_at: null,
        tags: ['complex', 'nested', 'json'],
        status: {
          active: true,
          verified: false,
          score: 98.7,
        },
      },
      user: {
        id: 12345,
        profile: {
          name: 'John Doe',
          age: 35,
          height: 5.9,
          contacts: {
            email: 'john.doe@example.com',
            phone: {
              home: '555-1234',
              work: '555-5678',
              emergency: {
                name: 'Jane Doe',
                relation: 'sister',
                phone: '555-9999',
              },
            },
          },
          addresses: [
            {
              type: 'home',
              street: '123 Main St',
              city: 'New York',
              zipcode: 10001,
            },
            {
              type: 'work',
              street: '456 Office Blvd',
              city: 'San Francisco',
              zipcode: 94105,
            },
          ],
        },
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            sms: false,
            push: {
              enabled: true,
              sound: 'chime',
              priority: 'high',
            },
          },
          privacy: {
            tracking: {
              ads: false,
              analytics: true,
            },
            visibility: {
              profile: 'friends_only',
              last_seen: 'nobody',
            },
          },
        },
      },
      orders: [
        {
          order_id: 'ORD-001',
          date: '2025-01-15T10:20:30Z',
          total_price: 259.99,
          items: [
            {
              product_id: 'P-1001',
              name: 'Wireless Headphones',
              quantity: 2,
              price_per_unit: 99.99,
            },
            {
              product_id: 'P-1002',
              name: 'USB-C Charger',
              quantity: 1,
              price_per_unit: 59.99,
            },
          ],
        },
        {
          order_id: 'ORD-002',
          date: '2025-02-01T14:45:00Z',
          total_price: 120.5,
          items: [
            {
              product_id: 'P-2001',
              name: 'Mechanical Keyboard',
              quantity: 1,
              price_per_unit: 120.5,
            },
          ],
        },
      ],
      system: {
        logs: [
          {
            timestamp: '2025-02-04T12:34:56Z',
            level: 'error',
            message: 'Database connection lost',
            metadata: {
              code: 500,
              retry_attempts: 3,
              stack_trace: ['db.connect()', 'handle_request()', 'main()'],
            },
          },
          {
            timestamp: '2025-02-04T12:35:30Z',
            level: 'info',
            message: 'Reconnected to database',
          },
        ],
        config: {
          version: '1.2.3',
          features: {
            beta: {
              enabled: true,
              flags: ['new_dashboard', 'ai_assist'],
            },
            security: {
              firewall: {
                enabled: true,
                rules: [
                  {
                    id: 'FW-001',
                    action: 'allow',
                    source: '192.168.1.1/24',
                  },
                  {
                    id: 'FW-002',
                    action: 'deny',
                    source: '0.0.0.0/0',
                  },
                ],
              },
              encryption: {
                enabled: true,
                key_rotation: {
                  interval_days: 90,
                  last_rotation: '2025-01-01T00:00:00Z',
                },
              },
            },
          },
        },
      },
    };

    const expectedMapping: MappingTypeMapping = {
      date_detection: true,
      dynamic: true,
      properties: {
        metadata: {
          properties: {
            created_at: {
              // TODO When date parsing is supported, change to 'date' type
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            id: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            status: {
              properties: {
                active: {
                  type: 'boolean',
                },
                score: {
                  type: 'float',
                },
                verified: {
                  type: 'boolean',
                },
              },
            },
            tags: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            updated_at: {
              type: 'null',
            },
          },
        },
        orders: {
          properties: {
            date: {
              // TODO When date parsing is supported, change to 'date' type
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            items: {
              properties: {
                name: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                },
                price_per_unit: {
                  type: 'float',
                },
                product_id: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                },
                quantity: {
                  type: 'integer',
                },
              },
            },
            order_id: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            total_price: {
              type: 'float',
            },
          },
        },
        system: {
          properties: {
            config: {
              properties: {
                features: {
                  properties: {
                    beta: {
                      properties: {
                        enabled: {
                          type: 'boolean',
                        },
                        flags: {
                          type: 'text',
                          fields: {
                            keyword: {
                              type: 'keyword',
                              ignore_above: 256,
                            },
                          },
                        },
                      },
                    },
                    security: {
                      properties: {
                        encryption: {
                          properties: {
                            enabled: {
                              type: 'boolean',
                            },
                            key_rotation: {
                              properties: {
                                interval_days: {
                                  type: 'integer',
                                },
                                last_rotation: {
                                  // TODO When date parsing is supported, change to 'date' type
                                  type: 'text',
                                  fields: {
                                    keyword: {
                                      type: 'keyword',
                                      ignore_above: 256,
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        firewall: {
                          properties: {
                            enabled: {
                              type: 'boolean',
                            },
                            rules: {
                              properties: {
                                action: {
                                  type: 'text',
                                  fields: {
                                    keyword: {
                                      type: 'keyword',
                                      ignore_above: 256,
                                    },
                                  },
                                },
                                id: {
                                  type: 'text',
                                  fields: {
                                    keyword: {
                                      type: 'keyword',
                                      ignore_above: 256,
                                    },
                                  },
                                },
                                source: {
                                  type: 'text',
                                  fields: {
                                    keyword: {
                                      type: 'keyword',
                                      ignore_above: 256,
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                version: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                },
              },
            },
            logs: {
              properties: {
                level: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                },
                message: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                },
                metadata: {
                  properties: {
                    code: {
                      type: 'integer',
                    },
                    retry_attempts: {
                      type: 'integer',
                    },
                    stack_trace: {
                      type: 'text',
                      fields: {
                        keyword: {
                          type: 'keyword',
                          ignore_above: 256,
                        },
                      },
                    },
                  },
                },
                timestamp: {
                  // TODO When date parsing is supported, change to 'date' type
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                },
              },
            },
          },
        },
        user: {
          properties: {
            id: {
              type: 'integer',
            },
            preferences: {
              properties: {
                notifications: {
                  properties: {
                    email: {
                      type: 'boolean',
                    },
                    push: {
                      properties: {
                        enabled: {
                          type: 'boolean',
                        },
                        priority: {
                          type: 'text',
                          fields: {
                            keyword: {
                              type: 'keyword',
                              ignore_above: 256,
                            },
                          },
                        },
                        sound: {
                          type: 'text',
                          fields: {
                            keyword: {
                              type: 'keyword',
                              ignore_above: 256,
                            },
                          },
                        },
                      },
                    },
                    sms: {
                      type: 'boolean',
                    },
                  },
                },
                privacy: {
                  properties: {
                    tracking: {
                      properties: {
                        ads: {
                          type: 'boolean',
                        },
                        analytics: {
                          type: 'boolean',
                        },
                      },
                    },
                    visibility: {
                      properties: {
                        last_seen: {
                          type: 'text',
                          fields: {
                            keyword: {
                              type: 'keyword',
                              ignore_above: 256,
                            },
                          },
                        },
                        profile: {
                          type: 'text',
                          fields: {
                            keyword: {
                              type: 'keyword',
                              ignore_above: 256,
                            },
                          },
                        },
                      },
                    },
                  },
                },
                theme: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                },
              },
            },
            profile: {
              properties: {
                addresses: {
                  properties: {
                    city: {
                      type: 'text',
                      fields: {
                        keyword: {
                          type: 'keyword',
                          ignore_above: 256,
                        },
                      },
                    },
                    street: {
                      type: 'text',
                      fields: {
                        keyword: {
                          type: 'keyword',
                          ignore_above: 256,
                        },
                      },
                    },
                    type: {
                      type: 'text',
                      fields: {
                        keyword: {
                          type: 'keyword',
                          ignore_above: 256,
                        },
                      },
                    },
                    zipcode: {
                      type: 'integer',
                    },
                  },
                },
                age: {
                  type: 'integer',
                },
                contacts: {
                  properties: {
                    email: {
                      type: 'text',
                      fields: {
                        keyword: {
                          type: 'keyword',
                          ignore_above: 256,
                        },
                      },
                    },
                    phone: {
                      properties: {
                        emergency: {
                          properties: {
                            name: {
                              type: 'text',
                              fields: {
                                keyword: {
                                  type: 'keyword',
                                  ignore_above: 256,
                                },
                              },
                            },
                            phone: {
                              type: 'text',
                              fields: {
                                keyword: {
                                  type: 'keyword',
                                  ignore_above: 256,
                                },
                              },
                            },
                            relation: {
                              type: 'text',
                              fields: {
                                keyword: {
                                  type: 'keyword',
                                  ignore_above: 256,
                                },
                              },
                            },
                          },
                        },
                        home: {
                          type: 'text',
                          fields: {
                            keyword: {
                              type: 'keyword',
                              ignore_above: 256,
                            },
                          },
                        },
                        work: {
                          type: 'text',
                          fields: {
                            keyword: {
                              type: 'keyword',
                              ignore_above: 256,
                            },
                          },
                        },
                      },
                    },
                  },
                },
                height: {
                  type: 'float',
                },
                name: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    it('should correctly parse types of a deeply nested document', () => {
      const result = determineMapping(document, 50000);
      expect(result).toEqual(expectedMapping);
    });

    it('should error out when the object is too deeply nested', () => {
      expect(() => determineMapping(document, 4)).toThrow();
    });
  });

  describe('determineMappingFromDocuments()', () => {
    const TEXT = {
      type: 'text',
      fields: { keyword: { type: 'keyword', ignore_above: 256 } },
    };

    it('should consider every sampled row, not just the first (mixed-type column -> text)', () => {
      // A CSV column that is numeric in row 1 but not in row 2 must not be mapped integer,
      // otherwise every non-numeric row fails with mapper_parsing_exception
      const result = determineMappingFromDocuments(
        [
          { code: '123', name: 'a' },
          { code: 'N/A', name: 'b' },
        ],
        20
      );
      expect(result.properties).toEqual({ code: TEXT, name: TEXT });
    });

    it('should keep a numeric type when every row agrees', () => {
      const result = determineMappingFromDocuments([{ n: '1' }, { n: '22' }, { n: '-3' }], 20);
      expect(result.properties).toEqual({ n: { type: 'integer' } });
    });

    it('should widen integer + float to float', () => {
      const result = determineMappingFromDocuments([{ n: '1' }, { n: '2.5' }], 20);
      expect(result.properties).toEqual({ n: { type: 'float' } });
    });

    it('should widen a numeric column with empty cells to text', () => {
      // An empty string cannot be indexed into a numeric field
      const result = determineMappingFromDocuments([{ n: '1' }, { n: '' }], 20);
      expect(result.properties).toEqual({ n: TEXT });
    });

    it('should treat boolean + number conflicts as text', () => {
      const result = determineMappingFromDocuments([{ f: 'true' }, { f: '1' }], 20);
      expect(result.properties).toEqual({ f: TEXT });
    });

    it('should take the non-null type when a field is null in some rows', () => {
      const result = determineMappingFromDocuments([{ n: null }, { n: 4 }], 20);
      expect(result.properties).toEqual({ n: { type: 'integer' } });
    });

    it('should union fields that only appear in some rows', () => {
      const result = determineMappingFromDocuments([{ a: '1' }, { b: 'x' }], 20);
      expect(result.properties).toEqual({ a: { type: 'integer' }, b: TEXT });
    });

    it('should merge nested objects field by field', () => {
      const result = determineMappingFromDocuments(
        [{ o: { x: '1', y: 'a' } }, { o: { x: 'oops', z: true } }],
        20
      );
      expect(result.properties).toEqual({
        o: { properties: { x: TEXT, y: TEXT, z: { type: 'boolean' } } },
      });
    });

    it('should keep the top-level dynamic settings', () => {
      const result = determineMappingFromDocuments([{ a: 'x' }], 20);
      expect(result).toMatchObject({ dynamic: true, date_detection: true });
    });

    it('should return an empty mapping for no documents', () => {
      expect(determineMappingFromDocuments([], 20)).toEqual({
        dynamic: true,
        date_detection: true,
        properties: {},
      });
    });
  });

  describe('numeric string detection', () => {
    const TEXT = {
      type: 'text',
      fields: { keyword: { type: 'keyword', ignore_above: 256 } },
    };

    it.each(['007', '00123', '0x1F', '1e3', ' ', 'Infinity', '+5', '1.', '.5'])(
      'should map identifier-like / non-decimal string %p as text, not a number',
      (value) => {
        expect(determineMapping({ v: value }, 20).properties).toEqual({ v: TEXT });
      }
    );

    it.each([
      ['0', 'integer'],
      ['42', 'integer'],
      ['-17', 'integer'],
      ['0.5', 'float'],
      ['-3.25', 'float'],
    ])('should still map decimal string %p as %p', (value, type) => {
      expect(determineMapping({ v: value }, 20).properties).toEqual({ v: { type } });
    });

    it('should still map real JS numbers as numbers', () => {
      expect(determineMapping({ v: 7 }, 20).properties).toEqual({ v: { type: 'integer' } });
    });
  });
});
