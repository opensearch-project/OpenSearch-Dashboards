# Keyboard Shortcuts

Comprehensive guide to keyboard shortcuts and customization in OpenSearch Dashboards

## Keyboard Shortcuts Help Modal

OpenSearch Dashboards includes a built-in keyboard shortcuts help modal that displays all available shortcuts organized by category.

> **Quick Access:** Press `?` or `Shift+/` from anywhere in the application to open the help modal.

The modal shows shortcuts grouped by categories like "Navigation", "Search", "Data Actions", etc. Each shortcut displays the key combination and description.

## Default Keyboard Shortcuts

### macOS/Windows/Linux

#### Navigation

| Shortcut  |            Command          |                      Description                  | Available application|
|-----------|-----------------------------|---------------------------------------------------|----------------------|
| `G B`     | Go to Dashboard             | Navigate to Dashboard application                 | (Global)            |
| `G V`     | Go to Visualize             | Navigate to Visualize application                 | (Global)            |
| `G D`     | Go to Discover              | Navigate to Discover application                  | (Global)            |
| `?`       | Show this help              | Opens the help modal with all available shortcuts | (Global)            |
| `Shift+L` | Switch to logs tab          | Navigate to logs tab in Explore                   | (Explore)           |
| `Shift+P` | Switch to patterns tab      | Navigate to patterns tab in Explore               | (Explore)           |
| `Shift+V` | Switch to visualization tab | Navigate to visualization tab in Explore          | (Visualization)     |

#### Panel / Layout

| Shortcut  |            Command           |                Description                | Available application |
|-----------|------------------------------|-------------------------------------------|-----------------------|
| `Shift+B` | Toggle Navbar                | Shows/hides the main navigation bar       | (Global)              |
| `Shift+F` | Toggle fields panel          | Shows/hides the fields selector panel     | (Explore)             |
| `Shift+F` | Toggle full-screen           | Toggle full-screen mode                   | (Dashboard)           |
| `Shift+E` | Toggle edit mode             | Toggle edit mode                          | (Dashboard)           |
| `Shift+C` | Toggle visualization sidebar | Toggle visualization sidebar              | (Visualization)       |

#### Search

| Shortcut  |            Command           |                Description                | Available application |
|-----------|------------------------------|-------------------------------------------|-----------------------|
| `Shift+O` | Saved search                 | Opens saved search dialog                 | (Discover)            |
| `Shift+D` | Open date picker             | Opens the time range selector             | (Global)              |
| `Shift+Q` | Recent queries               | Opens recent queries panel                | (Explore)             |
| `R`       | Refresh results              | Refreshes the current data view           | (Global)              |
| `/`       | Focus Search bar             | Focuses the search query input field      | (Global)              |

#### Data Actions

| Shortcut  |            Command           |                Description                | Available application |
|-----------|------------------------------|-------------------------------------------|-----------------------|
| `E`       | Download CSV                 | Downloads current results as CSV          | (Explore)             |
| `A`       | Add to dashboard             | Adds current visualization to dashboard   | (Visualize)           |
| `A`       | Add panel to dashboard       | Add panel to dashboard                    | (Dashboard)           |
| `⌘ S`     | Save discover search         | Saves the current discover search         | (Discover)            |
| `⌘ S`     | Save dashboard               | Save dashboard                            | (Dashboard)           |
| `⌘ S`     | Save visualization           | Save visualization                        | (Visualize)           |

#### Global Dev Tools

| Shortcut  |            Command           |                Description                | Available application |
|-----------|------------------------------|-------------------------------------------|-----------------------|
| `~`       | Open global dev console      | Opens the browser developer console       | (Global)              |


## Supported Keys and Modifiers

### Modifier Keys

OpenSearch Dashboards supports the following modifier combinations in canonical order:

| Type             |                 Combinations                  |      Example      |
|------------------|-----------------------------------------------|-------------------|
| Single Modifiers | `shift+`, `alt+`, `cmd+`                      | `Cmd+S`           |
| Double Modifiers | `alt+shift+`, `cmd+shift+`, `cmd+alt+`        | `Cmd+Shift+Z`     |
| Triple Modifiers | `cmd+alt+shift+`                              | `Cmd+Alt+Shift+I` |

> **Platform Mapping:** `cmd` automatically maps to Command (⌘) on macOS and Ctrl on Windows/Linux.

### Supported Keys

| Category     |                        Keys                        |                    Notes                   |
|--------------|----------------------------------------------------|--------------------------------------------|
| Letters      | `a-z`                                              | Case-insensitive, normalized to lowercase  |
| Numbers      | `0-9`                                              | Main keyboard row only                     |
| Punctuation  | `, - = [ ] ; ' . / \ ``                            | Common symbols for shortcuts               |
| Arrow Keys   | `left, up, right, down`                            | Navigation keys                            |
| Special Keys | `tab, enter, escape, space, backspace, delete`     | Function and control keys                  |

## Registering Keyboard Shortcuts

OpenSearch Dashboards provides a custom React hook (`useKeyboardShortcut`) that simplifies keyboard shortcut registration with automatic lifecycle management. This hook handles registration when the component mounts and cleanup when it unmounts, ensuring shortcuts are properly managed throughout the component lifecycle.


### For Developers

To register a keyboard shortcut in your plugin using the custom React hook:

```typescript
import { useCallback } from 'react';
import { useOpenSearchDashboards } from '../opensearch_dashboards_react/public';

function MyComponent() {
  const opensearchDashboards = useOpenSearchDashboards<YourPluginServices>();
  const { keyboardShortcut } = opensearchDashboards.services;

  // Memoized callback to avoid re-registration
  const handleAction = useCallback(() => {
    // Your action logic here or call function 
  }, []);

  keyboardShortcut?.useKeyboardShortcut({
    id: 'my_action',
    pluginId: 'myPlugin',
    name: 'My Custom Action',
    category: 'Custom Actions',
    keys: 'cmd+shift+m',
    execute: handleAction,
  });
}
```

> **Important:** Always use memoized callbacks with `useCallback` to prevent unnecessary re-registrations of shortcuts.

## Keyboard Shortcut Categories

Shortcuts are organized into logical categories for better discoverability:

| Category      |              Description              |                     Examples                        |
|---------------|---------------------------------------|-----------------------------------------------------|
| Navigation    | Moving between applications and tabs  | Go to Dashboard (G B), Go to Discover (G D)         |
| Search        | Query and data filtering actions      | Focus search bar (/), Open date picker (Shift+D)    |
| Data Actions  | Data manipulation and export          | Download CSV (E), Save operations (⌘ S)             |
| Panel / Layout| UI layout and panel management        | Toggle navbar (Shift+B), Toggle edit mode (Shift+E) |

## Multi-Key Sequences

OpenSearch Dashboards supports GitHub-style multi-key sequences (e.g., `G D`):

```typescript
// Example: 'g d' sequence for "go to dashboard"
keyboardShortcut?.useKeyboardShortcut({
  id: 'go_to_dashboard',
  pluginId: 'navigation',
  name: i18n.translate('navigation.shortcuts.goToDashboard', {
    defaultMessage: 'Go to Dashboard',
  }),
  category: i18n.translate('navigation.shortcuts.category', {
    defaultMessage: 'Navigation',
  }),
  keys: 'g d',  // Two separate key presses
  execute: goToDashboard,
});
```

### Sequence Rules

- Must be exactly two space-separated keys
- First key must be a valid sequence prefix
- Second key must be a single letter (a-z)
- Timeout of 1000ms between key presses

## Troubleshooting

### Common Issues

| Issue                    |                    Cause                    |                              Solution                                  |
|--------------------------|---------------------------------------------|------------------------------------------------------------------------|
| Shortcut not working     | Wrong application context                   | Ensure you're in the correct application (e.g., Dashboard for Shift+E) |
| Multi-key sequence fails | Keys pressed too slowly                     | Press sequence keys within 1000ms timeout (e.g., G then D)             |
| Shortcuts disabled       | Focus in text input fields                  | Click outside input fields to enable shortcuts                         |
| Key conflicts            | Multiple shortcuts use same combination     | Last registered shortcut takes precedence                              |

### Best Practices

- **Use memoized callbacks**: Always wrap callback functions with `useCallback` to prevent unnecessary re-registrations
- **Follow naming conventions**: Use consistent categorization (Navigation, Search, Data Actions, Panel / Layout)
- **Test across platforms**: Ensure modifier keys work correctly on macOS (⌘) and Windows/Linux (Ctrl)
- **Avoid browser conflicts**: Don't use common browser shortcuts like `Cmd+R` (refresh) or `Cmd+T` (new tab)
- **Internationalize text**: Use `i18n.translate()` for `name` and `category` fields to support multiple languages
- **Provide clear descriptions**: Write descriptive names for the help modal
- **Use appropriate categories**: Group related shortcuts together for better discoverability in the help modal

## API Reference

### ShortcutDefinition Interface

```typescript
interface ShortcutDefinition {
  id: string;           // Unique within plugin
  pluginId: string;     // Plugin namespace
  name: string;         // Human-readable name
  category: string;     // Grouping category
  keys: string;         // Key combination
  execute: () => void;  // Action function
}
```

### KeyboardShortcutService Methods

| Method                           |                    Description                    |                     Parameters                     |
|----------------------------------|---------------------------------------------------|----------------------------------------------------|
| `register(shortcut)`             | Register a new shortcut                           | `ShortcutDefinition`                               |
| `unregister(shortcut)`           | Remove a shortcut                                 | `Pick<ShortcutDefinition, 'id' \| 'pluginId'>`     |
| `getAllShortcuts()`              | Get all registered shortcuts                      | None                                               |
| `useKeyboardShortcut(shortcut)`  | React hook for automatic lifecycle management     | `ShortcutDefinition`                               |

> This keyboard shortcut system provides a powerful, extensible way to enhance user productivity in OpenSearch Dashboards while maintaining consistency and avoiding conflicts across plugins.
