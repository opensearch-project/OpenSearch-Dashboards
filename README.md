# OpenSearch Dashboards

Hello!

OpenSearch Dashboards is a visualization tool derived from Kibana 7.10.2.

## Current State

We officially began work on the new fork on January 21st, 2021. Since then, we've been removing non-Apache code and doing a full deep rename of the project. As this is an early phase, we don't expect the codebase to be bug free or to work perfectly. If you find an issue, feel free to open an issue [here](https://github.com/opensearch-project/OpenSearch-Dashboards/issues). 

## What works

* All references to non-Apache 2.0 code should be removed.
* Core plugins (non-3rd party)
* New project name should be used everywhere.
* ```yarn osd bootstrap```, ESLint and commit hook should be passing.
* CI / CD with DCO check

## What doesn’t works

* Jest Unit test cases
* Integration test cases
* Functional test cases
* 3rd party plugins (including OpenDistro)

## Guiding Principles

* Great software. If it doesn’t solve a user's problem, everything else is moot. It shall be software you love to use.
* Open source like we mean it. Contributors shall be invested in this being a successful open source project for the long term. It’s all Apache 2.0. There’s no Contributor License Agreement. Easy.
* A level playing field. Contributors shall not tweak the software so that it runs better for any vendor at the expense of others. If this happens, call it out and the contributors shall fix it together as a community.
* Used everywhere. The project goal is for as many people as possible to use it in their business, their software, and their projects. Use it however you want. Surprise the community!
* Made with community input. Project maintainers shall ask for public input on direction, requirements, and implementation for any feature built.
* Open to all contributions. Great open source software is built together, with a diverse community of contributors. If you want to get involved at any level - big, small, or huge - the project maintainers shall find a way to make it happen.
* Respectful, approachable, and friendly. This will be a community where all will be heard, accepted, and valued, whether a new or experienced user or contributor.
* A place to invent and innovate. You will be able to innovate rapidly. This project shall have a stable and predictable foundation that is modular, making it easy to extend.

## How you can help

### Look for the label "help wanted"

If you're excited to jump in, we've tried to mark a few issues that would be good candidates to get started on. Look for the label "help wanted" to find them. https://github.com/opensearch-project/OpenSearch/labels/help%20wanted

### Watch the forum, there are a bunch of things we want to talk about

As we've been working, we've come up with a bunch of questions that we wanted to get community feedback on. Now that we're done with this first pass of renaming, you'll see us posting those questions to the forum. Please let us know your thoughts!

### Questions? Feedback?

Let us know in the [forums](https://discuss.opendistrocommunity.dev/). w00t!!!