FROM rockylinux:8.5

# Install all the necessary tools to build the packages
RUN yum clean all && yum update -y
RUN yum install -y \
    curl \
    tar \
    findutils \
    git \
    xz  \
    gcc \
    make \
    bc \
    sed \
    gzip \
    autoconf \
    automake \
    libtool \
    python3-devel \
    python3-pip \
    jq \
    unzip

RUN git clone https://github.com/google/brotli.git -b v1.0.9

RUN cd brotli && chmod +x ./bootstrap && ./bootstrap && ./configure --prefix=/usr --bindir=/usr/bin --sbindir=/usr/sbin --libexecdir=/usr/lib64/brotli --libdir=/usr/lib64/brotli --datarootdir=/usr/share --mandir=/usr/share/man/man1 --docdir=/usr/share/doc \
    && make && make install

RUN mkdir -p /usr/local/lib/wazuh

# Add the scripts to build the RPM package
ADD base-builder.sh /usr/local/bin/builder
ADD VERSION.json /usr/local/bin/VERSION.json
ADD plugins /usr/local/bin/plugins
ADD run-with-retry.sh /usr/local/lib/wazuh/run-with-retry.sh
RUN chmod +x /usr/local/bin/builder

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/builder"]
