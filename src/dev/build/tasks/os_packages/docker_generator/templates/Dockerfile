################################################################################
# This Dockerfile was generated from the template at:
#   src/dev/build/tasks/os_packages/docker_generator/templates/Dockerfile
#
# Beginning of multi stage Dockerfile
################################################################################

################################################################################
# Build stage 0 `builder`:
# Extract OpenSearch Dashboards artifact
################################################################################
FROM {{{baseOSImage}}} AS builder

{{#ubi}}
RUN {{packageManager}} install -y findutils tar gzip
{{/ubi}}

{{#usePublicArtifact}}
# TODO: Update this link or remove functionality
# RUN cd /opt && \
#   curl --retry 8 -s -L -O https://artifacts.opensearch.co/downloads/opensearch-dashboards/{{artifactTarball}} && \
#   cd -
{{/usePublicArtifact}}

{{^usePublicArtifact}}
COPY {{artifactTarball}} /opt
{{/usePublicArtifact}}

RUN mkdir /usr/share/opensearch-dashboards
WORKDIR /usr/share/opensearch-dashboards
RUN tar --strip-components=1 -zxf /opt/{{artifactTarball}}
# Ensure that group permissions are the same as user permissions.
# This will help when relying on GID-0 to run OpenSearch Dashboards, rather than UID-1000.
# OpenShift does this, for example.
# REF: https://docs.openshift.org/latest/creating_images/guidelines.html
RUN chmod -R g=u /usr/share/opensearch-dashboards
RUN find /usr/share/opensearch-dashboards -type d -exec chmod g+s {} \;

################################################################################
# Build stage 1 (the actual OpenSearch Dashboards image):
#
# Copy opensearch-dashboards from stage 0
# Add entrypoint
################################################################################
FROM {{{baseOSImage}}}
EXPOSE 5601

{{#ubi}}
  # https://github.com/rpm-software-management/microdnf/issues/50
  RUN mkdir -p /run/user/$(id -u)
{{/ubi}}

RUN for iter in {1..10}; do \
      {{packageManager}} update --setopt=tsflags=nodocs -y && \
      {{packageManager}} install --setopt=tsflags=nodocs -y \
        fontconfig freetype shadow-utils libnss3.so {{#ubi}}findutils{{/ubi}} && \
      {{packageManager}} clean all && exit_code=0 && break || exit_code=$? && echo "{{packageManager}} error: retry $iter in 10s" && \
      sleep 10; \
    done; \
    (exit $exit_code)

# Add an init process, check the checksum to make sure it's a match
RUN curl -L -o /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64
RUN echo "37f2c1f0372a45554f1b89924fbb134fc24c3756efaedf11e07f599494e0eff9  /usr/local/bin/dumb-init" | sha256sum -c -
RUN chmod +x /usr/local/bin/dumb-init

RUN mkdir /usr/share/fonts/local
RUN curl -L -o /usr/share/fonts/local/NotoSansCJK-Regular.ttc https://github.com/googlefonts/noto-cjk/raw/NotoSansV2.001/NotoSansCJK-Regular.ttc
RUN echo "5dcd1c336cc9344cb77c03a0cd8982ca8a7dc97d620fd6c9c434e02dcb1ceeb3  /usr/share/fonts/local/NotoSansCJK-Regular.ttc" | sha256sum -c -
RUN fc-cache -v

# Bring in OpenSearch Dashboards from the initial stage.
COPY --from=builder --chown=1000:0 /usr/share/opensearch-dashboards /usr/share/opensearch-dashboards
WORKDIR /usr/share/opensearch-dashboards
RUN ln -s /usr/share/opensearch-dashboards /opt/opensearch-dashboards

ENV OPENSEARCH_CONTAINER true
ENV PATH=/usr/share/opensearch-dashboards/bin:$PATH

# Set some OpenSearch Dashboards configuration defaults.
COPY --chown=1000:0 config/opensearch_dashboards.yml /usr/share/opensearch-dashboards/config/opensearch_dashboards.yml

# Add the launcher/wrapper script. It knows how to interpret environment
# variables and translate them to OpenSearch Dashboards CLI options.
COPY --chown=1000:0 bin/opensearch-dashboards-docker /usr/local/bin/

# Ensure gid 0 write permissions for OpenShift.
RUN chmod g+ws /usr/share/opensearch-dashboards && \
    find /usr/share/opensearch-dashboards -gid 0 -and -not -perm /g+w -exec chmod g+w {} \;

# Remove the suid bit everywhere to mitigate "Stack Clash"
RUN find / -xdev -perm -4000 -exec chmod u-s {} +

# Provide a non-root user to run the process.
RUN groupadd --gid 1000 opensearch-dashboards && \
    useradd --uid 1000 --gid 1000 \
      --home-dir /usr/share/opensearch-dashboards --no-create-home \
      opensearch-dashboards

LABEL org.label-schema.build-date="{{dockerBuildDate}}" \
  org.label-schema.license="{{license}}" \
  org.label-schema.name="OpenSearch Dashboards" \
  org.label-schema.schema-version="1.0" \
  org.label-schema.url="https://opensearch.org/" \
  org.label-schema.usage="https://opensearch.org/" \
  org.label-schema.vcs-ref="{{revision}}" \
  org.label-schema.vcs-url="https://github.com/opensearch-project/OpenSearch-Dashboards" \
  org.label-schema.vendor="OpenSearch" \
  org.label-schema.version="{{version}}" \
  org.opencontainers.image.created="{{dockerBuildDate}}" \
  org.opencontainers.image.documentation="https://opensearch.org/" \
  org.opencontainers.image.licenses="{{license}}" \
  org.opencontainers.image.revision="{{revision}}" \
  org.opencontainers.image.source="https://github.com/opensearch-project/OpenSearch-Dashboards" \
  org.opencontainers.image.title="OpenSearch Dashboards" \
  org.opencontainers.image.url="https://opensearch.org/" \
  org.opencontainers.image.vendor="OpenSearch" \
  org.opencontainers.image.version="{{version}}"

{{#ubi}}
LABEL name="OpenSearch Dashboards" \
  vendor="OpenSearch" \
  version="{{version}}" \
  release="1" \
  summary="OpenSearch Dashboards" \
  description="OpenSearch Dashboards for exploring and visualizing OpenSearch data"

RUN mkdir /licenses && \
    cp LICENSE.txt /licenses/LICENSE
{{/ubi}}

USER opensearch-dashboards

ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]

CMD ["/usr/local/bin/opensearch-dashboards-docker"]
