# Health Check Plugin Documentation

Welcome to the complete documentation for the Wazuh dashboard Health Check plugin. This documentation is organized by audience and use type.

## 📚 Documentation Index

### 👥 For End Users

- **[User Guide](./USER_GUIDE.md)** - Complete guide for using the plugin
  - Access and navigation
  - Status interpretation
  - Data export
  - Common troubleshooting
  - Best practices

### 🛠️ For Developers

- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Complete technical documentation

  - Plugin architecture
  - Development environment setup
  - Component structure
  - Design patterns
  - Testing and debugging

- **[API Reference](./API_REFERENCE.md)** - Detailed API documentation
  - Client and server APIs
  - Reusable components
  - Custom hooks
  - Integration examples
  - Extensions and customization

## 🚀 Quick Start

### For Users

1. Access Wazuh dashboard
2. Navigate to **Dashboard Management > Health check**
3. Consult the [User Guide](./USER_GUIDE.md) for details

### For Developers

1. Clone the repository
2. Follow the [Developer Guide](./DEVELOPER_GUIDE.md) for setup
3. Consult the [API Reference](./API_REFERENCE.md) for integration

## 📋 Key Features

- ✅ **Real-time monitoring** of system status
- 📊 **Detailed tabular view** of all checks
- 📤 **Data export** in JSON format
- 🔗 **Integrated links** to support documentation
- 🎨 **Responsive interface** compatible with light and dark themes
- 🔄 **Automatic updates** of status

## 🏗️ Architecture

```
Health Check Plugin
├── Frontend (React + TypeScript)
│   ├── UI Components
│   ├── Data Services
│   └── State Management (RxJS)
├── Backend (Node.js)
│   ├── REST APIs
│   ├── Health Checks
│   └── Logging and Monitoring
└── OpenSearch Dashboards Integration
    ├── Plugin lifecycle
    ├── Navigation
    └── Themes and Styles
```

## 🐛 Report Issues

### Required Information

When reporting an issue, include:

1. **Detailed description** of the problem
2. **Steps to reproduce** the error
3. **Wazuh dashboard version**
4. **Relevant logs** (if available)
5. **Screenshots** (if applicable)

### Support Channels

- 🐛 **GitHub Issues**: For bugs and feature requests
- 💬 **Community forums**: For general questions
- 📖 **Official documentation**: For guides and tutorials

## 📞 Contact and Support

### Official Resources

- 🌐 **Website**: [wazuh.com](https://wazuh.com)
- 📖 **Documentation**: [documentation.wazuh.com](https://documentation.wazuh.com)
- 💻 **GitHub**: [github.com/wazuh/wazuh-dashboard](https://github.com/wazuh/wazuh-dashboard)

**Found something not covered in this documentation?**  
Please open an issue on GitHub or contribute with documentation improvements.
