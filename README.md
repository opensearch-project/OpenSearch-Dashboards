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
* Jest Unit Tests
* Jest Integration Tests
* CI / CD with DCO check

## What doesn’t work

* Functional test cases
* 3rd party plugins (including OpenDistro)

## Guiding Principles


* **Great software.** If it doesn’t solve your problems, everything else is moot. It’s going to be software you love to use.
* **Open source like we mean it.** We are invested in this being a successful open source project for the long term. It’s all Apache 2.0. There’s no Contributor License Agreement. Easy.
* **A level playing field.** We will not tweak the software so that it runs better for any vendor (including AWS) at the expense of others. If this happens, call it out and we will fix it as a community.
* **Used everywhere.** Our goal is for as many people as possible to use it in their business, their software, and their projects. Use it however you want. Surprise us!
* **Made with your input.** We will ask for public input on direction, requirements, and implementation for any feature we build.
* **Open to contributions.** Great open source software is built together, with a diverse community of contributors. If you want to get involved at any level - big, small, or huge - we will find a way to make that happen. We don’t know what that looks like yet, and we look forward to figuring it out together.
* **Respectful, approachable, and friendly.** This will be a community where you will be heard, accepted, and valued, whether you are a new or experienced user or contributor.
* **A place to invent.** You will be able to innovate rapidly. This project will have a stable and predictable foundation that is modular, making it easy to extend.

## Getting Started

To run OpenSearch Dashboards locally, you first need build artifacts from OpenSearch.
* Clone the OpenSearch repo with ```git clone git@github.com:opensearch-project/OpenSearch.git```
* Follow installation and setup instructions in the OpenSearch repo
* Run ```./gradlew assemble``` to generate build artifacts for all platforms
* Run ```./gradlew run -Drun.distribution=oss``` to run the oss build

Or
* You can also manually find the tar.gz file (.zip on Windows) at ```./distribution/archives/<platform-dir>/build/distributions``` and extract to your desired directory with ```tar -xvf /path/to/tar/file```
* After extracting, run ```bin/opensearch``` inside of the extracted build artifact dir

To run Dashboards with OpenSearch
* Run ```yarn osd bootstrap``` in the OpenSearch Dashboards directory
* While OpenSearch is running locally, run ```yarn start```
* You can now navigate to ```http://localhost:5603``` where Dashboards runs by default
* If you pass ```--no-base-path``` then it will default to port 5601

## Running tests

### Jest Unit Tests

Run the command ```yarn test:jest``` in the OpenSearch Dashboards project directory to run unit tests

### Jest Integration Tests

For the integration tests, you must pass the absolute path of your extracted OpenSearch build artifacts through the ```TEST_OPENSEARCH_FROM``` env variable so that Dashboards can run an OpenSearch cluster. You can run:
```TEST_OPENSEARCH_FROM=/path/to/extracted/build/artifact yarn test:jest_integration```

## How you can help

### Look for the label "help wanted"

If you're excited to jump in, we've tried to mark a few issues that would be good candidates to get started on. Look for the label "help wanted" to find them. https://github.com/opensearch-project/OpenSearch-Dashboards/labels/help%20wanted

### Watch the forum, there are a bunch of things we want to talk about

As we've been working, we've come up with a bunch of questions that we wanted to get community feedback on. Now that we're done with this first pass of renaming, you'll see us posting those questions to the forum. Please let us know your thoughts!

### Questions? Feedback?

Let us know in the [forums](https://discuss.opendistrocommunity.dev/). w00t!!!
