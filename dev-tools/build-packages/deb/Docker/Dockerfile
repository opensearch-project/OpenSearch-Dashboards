FROM debian:12

ENV DEBIAN_FRONTEND=noninteractive

# Installing necessary packages
RUN apt-get update && apt-get install -y --allow-change-held-packages apt-utils && \
    apt-get install -y --allow-change-held-packages \
    curl sudo wget expect gnupg build-essential \
    devscripts equivs selinux-basics procps gawk jq

# Add the script to build the Debian package
ADD deb-builder.sh /usr/local/bin/builder
ADD debian /usr/local/src/debian
RUN chmod +x /usr/local/bin/builder

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/builder"]
