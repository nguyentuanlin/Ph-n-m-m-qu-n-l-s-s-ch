const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hệ thống quản lý sổ sách API',
      version: '1.0.0',
      description: 'API documentation cho hệ thống quản lý sổ sách số hóa',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5002}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password', 'fullName', 'rank', 'unit', 'department', 'position', 'duty'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username',
              minLength: 3,
              maxLength: 30
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            fullName: {
              type: 'string',
              description: 'Full name',
              maxLength: 100
            },
            rank: {
              type: 'string',
              enum: ['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ', 'Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy', 'Thiếu tá', 'Trung tá', 'Thượng tá', 'Đại tá', 'Thiếu tướng', 'Trung tướng', 'Thượng tướng', 'Đại tướng'],
              description: 'Military rank'
            },
            unit: {
              type: 'string',
              description: 'Military unit (e.g., Tiểu đoàn 301)'
            },
            department: {
              type: 'string',
              enum: ['Tham mưu', 'Hậu cần', 'Chính trị', 'Kỹ thuật', 'Quân y', 'Tài chính', 'Pháp chế', 'Đối ngoại', 'Công nghệ thông tin', 'An ninh', 'Huấn luyện'],
              description: 'Department'
            },
            position: {
              type: 'string',
              description: 'Position/Title'
            },
            duty: {
              type: 'string',
              enum: ['Huấn luyện', 'Chiến đấu', 'Hậu cần', 'Tham mưu', 'Chính trị', 'Kỹ thuật', 'Quân y', 'Tài chính', 'Pháp chế', 'Đối ngoại', 'Công nghệ thông tin', 'An ninh'],
              description: 'Primary duty'
            },
            role: {
              type: 'string',
              enum: ['admin', 'commander', 'logistic', 'staff'],
              description: 'System role'
            },
            phone: {
              type: 'string',
              description: 'Phone number'
            },
            isActive: {
              type: 'boolean',
              description: 'Account status'
            }
          }
        },
        Book: {
          type: 'object',
          required: ['name', 'code', 'type', 'department', 'assignedTo'],
          properties: {
            _id: {
              type: 'string',
              description: 'Book ID'
            },
            name: {
              type: 'string',
              description: 'Book name',
              maxLength: 200
            },
            code: {
              type: 'string',
              description: 'Book code',
              maxLength: 50
            },
            type: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
              description: 'Book type'
            },
            description: {
              type: 'string',
              description: 'Book description',
              maxLength: 500
            },
            department: {
              type: 'string',
              description: 'Department'
            },
            assignedTo: {
              type: 'string',
              description: 'Assigned user ID'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'archived'],
              description: 'Book status'
            }
          }
        },
        BookEntry: {
          type: 'object',
          required: ['bookId', 'entryDate', 'data'],
          properties: {
            _id: {
              type: 'string',
              description: 'Entry ID'
            },
            bookId: {
              type: 'string',
              description: 'Book ID'
            },
            userId: {
              type: 'string',
              description: 'User ID'
            },
            entryDate: {
              type: 'string',
              format: 'date',
              description: 'Entry date'
            },
            data: {
              type: 'object',
              description: 'Entry data'
            },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'approved', 'rejected'],
              description: 'Entry status'
            },
            isOnTime: {
              type: 'boolean',
              description: 'Whether entry is on time'
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              description: 'Entry deadline'
            }
          }
        },
        Notification: {
          type: 'object',
          required: ['recipient', 'type', 'title', 'message'],
          properties: {
            _id: {
              type: 'string',
              description: 'Notification ID'
            },
            recipient: {
              type: 'string',
              description: 'Recipient user ID'
            },
            sender: {
              type: 'string',
              description: 'Sender user ID'
            },
            type: {
              type: 'string',
              enum: ['reminder', 'deadline_warning', 'deadline_missed', 'submission', 'approval', 'rejection', 'escalation', 'system'],
              description: 'Notification type'
            },
            title: {
              type: 'string',
              description: 'Notification title',
              maxLength: 200
            },
            message: {
              type: 'string',
              description: 'Notification message',
              maxLength: 1000
            },
            isRead: {
              type: 'boolean',
              description: 'Read status'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Notification priority'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Validation errors'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      },
      Rank: {
        type: 'object',
        required: ['name', 'level', 'category'],
        properties: {
          _id: {
            type: 'string',
            description: 'Rank ID'
          },
          name: {
            type: 'string',
            description: 'Rank name'
          },
          level: {
            type: 'number',
            description: 'Rank level (1-17)'
          },
          category: {
            type: 'string',
            enum: ['Enlisted', 'NCO', 'Officer', 'General'],
            description: 'Rank category'
          },
          description: {
            type: 'string',
            description: 'Rank description'
          },
          isActive: {
            type: 'boolean',
            description: 'Active status'
          }
        }
      },
      Unit: {
        type: 'object',
        required: ['name', 'code', 'type'],
        properties: {
          _id: {
            type: 'string',
            description: 'Unit ID'
          },
          name: {
            type: 'string',
            description: 'Unit name'
          },
          code: {
            type: 'string',
            description: 'Unit code'
          },
          type: {
            type: 'string',
            enum: ['Tiểu đội', 'Trung đội', 'Đại đội', 'Tiểu đoàn', 'Trung đoàn', 'Lữ đoàn', 'Sư đoàn', 'Quân đoàn', 'Quân khu'],
            description: 'Unit type'
          },
          parentUnit: {
            type: 'string',
            description: 'Parent unit ID'
          },
          commander: {
            type: 'string',
            description: 'Commander user ID'
          },
          location: {
            type: 'string',
            description: 'Unit location'
          },
          description: {
            type: 'string',
            description: 'Unit description'
          },
          isActive: {
            type: 'boolean',
            description: 'Active status'
          }
        }
      },
      Department: {
        type: 'object',
        required: ['name', 'code'],
        properties: {
          _id: {
            type: 'string',
            description: 'Department ID'
          },
          name: {
            type: 'string',
            description: 'Department name'
          },
          code: {
            type: 'string',
            description: 'Department code'
          },
          description: {
            type: 'string',
            description: 'Department description'
          },
          head: {
            type: 'string',
            description: 'Department head user ID'
          },
          responsibilities: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Department responsibilities'
          },
          isActive: {
            type: 'boolean',
            description: 'Active status'
          }
        }
      },
      Position: {
        type: 'object',
        required: ['name', 'code', 'department', 'level'],
        properties: {
          _id: {
            type: 'string',
            description: 'Position ID'
          },
          name: {
            type: 'string',
            description: 'Position name'
          },
          code: {
            type: 'string',
            description: 'Position code'
          },
          department: {
            type: 'string',
            description: 'Department ID'
          },
          level: {
            type: 'string',
            enum: ['Junior', 'Senior', 'Management', 'Executive'],
            description: 'Position level'
          },
          requirements: {
            type: 'object',
            properties: {
              minRank: {
                type: 'string',
                description: 'Minimum required rank ID'
              },
              experience: {
                type: 'number',
                description: 'Required experience in years'
              }
            }
          },
          responsibilities: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Position responsibilities'
          },
          description: {
            type: 'string',
            description: 'Position description'
          },
          isActive: {
            type: 'boolean',
            description: 'Active status'
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
