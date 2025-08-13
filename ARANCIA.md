# Open Search Dashboard - Mateus Queirós

**Elastic UI (EUI)** is a design system and component library originally developed by Elastic for Kibana, and adapted here for OpenSearch Dashboards. It provides a consistent set of UI components, styles, and patterns to build user interfaces efficiently and maintain visual consistency across the application.

As the Elastic ecosystem migrated to the Apache 2.0 license, developers saw the need to maintain a fully open-source UI library. This led to the creation of **OpenSearch** and **OpenSearch Dashboards**.

The **OUI library** is a fork of the official `@elastic/ui`, providing the same consistent UI components while remaining fully open source and compatible with OpenSearch Dashboards.

This repository contains the Open Search Dashboards integrated with a custom OUI version and an additional custom theme: **Arancia**.

# How to run this project

For the next steps you’ll need to use `nvm` and the correct node version for each project (although I have observed that `oui` could use the latest version):

You’ll need to clone this repository and the oui repository, preferrably in the same directory:

```bash
git clone -b arancia https://github.com/mateuscqueiros/OpenSearch-Dashboards
git clone -b arancia https://github.com/mateuscqueiros/oui
```

Next build the projects:

```bash
# Configure OUI themes
cd ./oui
yarn
yarn build

# Copy this path (OUI_PATH)
pwd

# Configure Dashboards
cd ../OpenSearch-Dashboards

# Reference your local project
find . -type f -name package.json -exec sed -i 's#\"@elastic/eui\": \".*\"#\"@elastic/eui\": \"file:/c/Users/Usuario/Documents/.work/personal/oui\"#g' {} \;

yarn osd clean
yarn osd bootstrap
```

Run the project using two process:

```bash
# Terminal 1: start the server locally
yarn opensearch snapshot

# Terminal 2: start the dashboards
yarn start
```

After that you’ll need to wait about 5 minutes for everything to get started. Even when the dashboards are ready you may need to wait a little longer before accessing the project to allow the server to load all the plugins. If you get an error when opening, you may need to wait longer or restart the dashboards service.

# Arancia theme

My custom OUI theme is inspired by [Arancia](https://arancia.ca/) and introduces a dark, high-contrast style. The core colors follow a warm red pattern, with vibrant red (#F2382C) for primary, soft coral (#FF7B72) for accent, and deep red (#B81E24) for danger. Secondary (#D98B1F) and warning (#FFB84D) are warm orange shades, complementing the reds while maintaining a cohesive, energetic look. High-contrast text ensures readability across the interface. Backgrounds and grays range from dark (#1B1A19) to lighter shades (#2A2625, #9E918D), providing subtle contrast and visual hierarchy.

To use this theme you need to go to the Sidebar and under Management, **Dashboard Management > Advanced Settings > Appearance > Theme version**. You can also enable the header menu item to quickly switch between themes.

# New components

While exploring OpenSearch Dashboards, I noticced that it does not currently include a dedicated client or user area. To explore how such a feature could be integrated, I created several custom components to demonstrate how a user area could appear in the dashboard header. These components illustrate potential interactions with notifications and user profile management in a clean and cohesive interface.

You can find the source code accessing `src/core/public/chrome/ui/header`.

The **Header Notification Event (**`header_notification_event.tsx`**)** component provides a flexible notification card, supporting different types, severity levels, badges, timestamps, and clickable titles. Users can mark notifications as read or unread, and a contextual menu allows further interaction with individual events. Its design integrates seamlessly with the existing OUI styling while supporting high-contrast readability and accessibility.

![image.png](image.png)

![image.png](image%201.png)

The **HeaderNotificationArea** **(**`header_notification_area.tsx`**)** component aggregates multiple notification events into a single popover, with filtering options and global actions such as "Mark all as read" or "Reset filters".

![image.png](image%202.png)

![image.png](image%203.png)

The **HeaderUserArea** **(**`header_user_area.tsx`**)** provides a dedicated user profile menu with avatar, name, email, main navigation actions, and footer actions like switching accounts or logging out. It also allows to navigate internal and external links using the native OpenDashboard Observers.

![image.png](image%204.png)

# Documentation References

- [https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/docs/theme.md](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/docs/theme.md)
- [https://github.com/opensearch-project/oui/blob/main/wiki/component-development.md#in-opensearch-dashboards](https://github.com/opensearch-project/oui/blob/main/wiki/component-development.md#in-opensearch-dashboards)
- [https://github.com/opensearch-project/oui/blob/main/wiki/theming.md](https://github.com/opensearch-project/oui/blob/main/wiki/theming.md)
- [https://github.com/opensearch-project/oui/blob/main/wiki/validating-with-opensearch-dashboards.md](https://github.com/opensearch-project/oui/blob/main/wiki/validating-with-opensearch-dashboards.md)
