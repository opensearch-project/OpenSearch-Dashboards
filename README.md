# OpenSearch Dashboards – Design System Enhancement

## Overview
This project enhances the OpenSearch Dashboards UI by introducing a structured design system and improving core UI components.  

The goal is to demonstrate design consistency, modern front-end practices, and with a strong focus on usability and accessibility.

![Design System Preview](./preview.jpg)

## Design Rationale
The design system was created with the following principles in mind:
- Clear visual hierarchy
- Consistent spacing and typography
- Improved contrast and accessibility
- Scalable architecture for future theming

Design decisions are centralized through tokens, reducing visual inconsistencies and making the UI easier to maintain and evolve.

## Design System Architecture
The theme is organized in layers to separate concerns and improve scalability:

- **Palette (e.g. `uiThemeColors`)**  
  Raw color values with no UI meaning.

- **Semantic tokens (e.g. `semanticColors`)**  
  Colors mapped to UI intent (text, background, borders, feedback states).

- **Component tokens (e.g. `componentTokens`)**  
  Component-specific contracts that encapsulate visual decisions and reduce coupling between components and global semantics.

In addition, global tokens are defined for spacing, typography, border radius, and elevation.

## Modified Components
The following components were updated to reflect the new design system:
- Header
- Sidebar
- Button
- Card
- Form Input

Each component includes improved visual hierarchy, clearer states (hover, focus, active, error), and better accessibility, while remaining aligned with OpenSearch design patterns.

## Setup & Build Instructions

### Prerequisites
- Node.js (recommended version from OpenSearch Dashboards documentation)
- Yarn
- Java (required by Gradle)
- Gradle

### Important Note (Docker Limitation)
At the time of this challenge, Docker images for **OpenSearch 3.5** were not yet available.

For this reason, OpenSearch was executed **locally via Gradle**, as no official Docker image was available at the time.

### Running OpenSearch locally
1. Download the OpenSearch 3.5 source or distribution.
2. Start OpenSearch using Gradle:
   ```bash
   ./gradlew run
    ```

### Running OpenSearch Dashboards locally
1. Clone this repository.
2. Navigate to the OpenSearch Dashboards directory.
3. Install dependencies:
   ```bash
   yarn install
   ```
4. Bootstrap OpenSearch Dashboards:
   ```bash
    yarn osd bootstrap
    ```
5. Start OpenSearch Dashboards:
    ```bash
    yarn start --no-base-path --opensearch=http://localhost:9200
    ```
6. Open your browser and navigate to `http://localhost:5601/app/myCustomThemeDemo` to view the test page showcasing the new design system and components.

## Extending the Theme

This design system is intended to be **scalable and easy to extend** as new UI components are added.

### Core Rule: Never Use the Color Palette Directly
Components **must not** consume raw palette colors (e.g. `blue500`, `gray100`) directly.

Instead, always use **semantic tokens**, such as:
- `semanticColors.background.surface`
- `semanticColors.text.primary`
- `semanticColors.intent.primary`
- `semanticColors.border.default`

This ensures:
- Consistent visual meaning
- Easier theming and future redesigns
- Safer global changes without breaking components

### Adding a New Component
When introducing a new component:

1. **Identify its intent**
   - Surface, container, action, feedback, etc.

2. **Map its needs to semantic tokens**
   - Background
   - Text
   - Border
   - States (hover, active, disabled)

3. **Create a small semantic mapping (optional)**
   If the component is complex or reused often, define a local semantic map:
   ```ts
   export const alertColors = {
     background: semanticColors.intent.warningBackground,
     text: semanticColors.text.primary,
     border: semanticColors.intent.warning,
   };
   ```

4. **Consume semantic tokens in styled components**
    ```ts
    const Alert = styled.div`
        background: ${alertColors.background};
        color: ${alertColors.text};
        border: 1px solid ${alertColors.border};
    `;
    ```

### When to Introduce New Semantic Tokens

Create new semantic tokens when:
- A visual meaning is reused across multiple components
- The same color represents a specific intent (success, danger, info)
- A component introduces a new UI concept

Avoid creating tokens for:
- One-off visual tweaks
- Purely decorative elements with no semantic meaning

This approach keeps the design system predictable, maintainable, and future-proof.