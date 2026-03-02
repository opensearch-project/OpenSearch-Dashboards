FROM centos:8
RUN mkdir -p /tmp
ARG PACKAGE
RUN cd /etc/yum.repos.d/
RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*
RUN sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*
RUN yum update -y
COPY ${PACKAGE} /tmp/wazuh.rpm
RUN yum install /tmp/wazuh.rpm -y
