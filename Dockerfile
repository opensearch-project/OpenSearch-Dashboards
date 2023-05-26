ARG NODE_VERSION=18.16.0
FROM node:${NODE_VERSION} AS base

ENV HOME '.'
RUN apt-get update && \
    apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
      libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
      libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
      libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
      libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget openjdk-8-jre && \
    rm -rf /var/lib/apt/lists/*

# Specify the version of Chrome that matches the version of chromedriver in the package.json.
# A list of Chrome versions can be found here:
# https://www.ubuntuupdates.org/package/google_chrome/stable/main/base/google-chrome-stable
ARG CHROME_VERSION=107.0.5304.121-1
RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && wget -O /tmp/chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}_amd64.deb \
  && apt-get update \
  && apt-get install -y rsync jq bsdtar /tmp/chrome.deb --no-install-recommends python-pip \
  && pip install awscli \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN groupadd -r opensearch-dashboards && useradd -r -g opensearch-dashboards opensearch-dashboards && mkdir /home/opensearch-dashboards && chown opensearch-dashboards:opensearch-dashboards /home/opensearch-dashboards

USER opensearch-dashboards
