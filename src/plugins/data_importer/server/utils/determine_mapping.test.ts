/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import { determineMapping } from './determine_mapping';

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
      expect(() => determineMapping(document, 4)).toThrowError();
    });
  });
});
