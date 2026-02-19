## INSTALATION 

1. git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
   cd OpenSearch-Dashboards
2. git checkout -b midnight_theme
   git pull origin midnight_theme
3. install yarn
4. ###### Install dependencies
   yarn osd bootstrap
   ###### Ensure your Node.js version is compatible (14.20.x – 22.x).
5. ###### Create OpenSearch Container
   docker run -d \
   --name opensearch-node \
   -p 9200:9200 \
   -p 9600:9600 \
   -e "discovery.type=single-node" \
   -e "plugins.security.disabled=true" \
   -e "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m" \
   opensearchproject/opensearch:2.11.1
6. ###### Run locally
   yarn start
   ###### Ensure no other docker container is running for the same.
   ###### Try docker rm -f opensearch-node if so.
   ###### Wait for 2-3 mins and the server shall be ready for example: ([OpenSearchDashboards][http] http server running at http://localhost:5603/dtx)

## Design Rationale ##

### - Theme file location
  src/
  </br>└─ core/
  </br>└─ public/
  </br>└─ styles/
  </br>└─ themes/
  </br>└─ _midnight_theme.scss/

### - Color pallet [influenced by the logo colors]:
  - --midnight-primary: `#172430` [deep, dark navy for interactive elements and headers]
  - --midnight-surface: `#fcfeff` [clean background for cards and panels]
  - --midnight-bg: `#b9d9eb` [subtle blue-gray to reduce eye strain]
  - --midnight-border: `#3a4148` [gray bold border to enhance form inputs]

### - Typography:

  - Bold fonts for headings and key buttons
  - Consistent font-family inherited from OUI theme

### - Spacing & Layout:

  - Rounded cards and buttons using a 6–12px border-radius
  - Smooth hover animations for buttons and icons
  - Rectified button text getting underlined on hover for neat UI
  - Rectified spacing for main element to maintain alignment with navbar elements.

### - UI Component Updates:

  - Buttons: Color change on hover, smooth scale animation, SVG icon fills
  - Navbar : Applied shadow for depth and provided bolder text for navigation buttons
  - Cards: Rounded edges, beta badges styled for high contrast
  - Form Inputs: Soft shadows to indicate focus and grouping
  - Tabs & Headers: Highlighting active tabs and subtle bottom shadows