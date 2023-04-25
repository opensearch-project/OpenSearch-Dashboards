# Docker Development Environment Setup
The following instructions demonstrate how to set up a development environment for OpenSearch Dashboards using Docker. It utilizes tools such as `Docker` and `VS Code`, and users should be familiar with the basic usages of them. Users will be able to develop and run the application inside VS Code without additional configurations.

1. Install [Docker](https://docs.docker.com/get-docker/) if not already installed.
    * Make sure that Docker daemon is running. (For windows and macos，you need to have [Docker Desktop](https://docs.docker.com/desktop/), or its alternatives, such as [Finch](https://github.com/runfinch/finch))

2. In the terminal, run the command below.
    * This should create a folder named `opensearch-dashboards-docker-dev` and it should contain two files: `docker-compose.yml` and `entrypoint.sh`.
    * Here is the link to the installer script: `https://raw.githubusercontent.com/opensearch-project/OpenSearch-Dashboards/main/dev-tools/install-docker-dev.sh` if needed.

```bash
curl -o- https://raw.githubusercontent.com/opensearch-project/OpenSearch-Dashboards/main/dev-tools/install-docker-dev.sh | bash
```

3. Open VS Code or [install it](https://code.visualstudio.com/download), if it's not already installed.
    * Make sure VS Code has the extensions `Dev Containers` and `Docker` installed. If not, go to `Extensions` tab, search and install them.

4. Under the Discover tab, click `Open Folder`, and open the `opensearch-dashboards-docker-dev` folder that we just created.

5. Open the `opensearch-dashboards-docker-dev` folder in VS Code integrated terminal, set environment variable for the fork repository URL by running the command below.
    * If fork repo has not been created: Go to [OpenSearch Dashboards github page](https://github.com/opensearch-project/OpenSearch-Dashboards) and under fork, select create a new fork, and then copy the https link of the fork url and use it in the above command. The command needs to be re-run every time it re-start the docker compose file in a new terminal.
```bash
export REPO_URL=[insert your fork repo url here]
```

6. Run the `docker-compose.yml` file in the background by typing:
```bash
docker compose up -d --build
```

7. Under the `Docker` tab in VS Code, verify that there are two containers running: `opensearchproject/opensearch:latest` and `abbyhu/opensearch-dashboards-dev:latest`.
    * This can also be verified by using the command line:
    ```bash
    docker ps
    ```

8. <span id="install-step-8"></span> Right-click `abbyhu/opensearch-dashboards-dev:latest`, and select `Attach Visual Studio Code`.
    * This will ssh into the container and you will be able to view and edit the files using VS Code as the code editor.
    * If you do not wish to use VS Code as the code editor, the alternative way of ssh into the container is by using the command below:
    ```bash
    docker exec -it dev-env /bin/bash
    ```

9. For the new VS Code window, if it is not showing the repository code, then select `Open Folder`. Then open `/docker-workspace/OpenSearch-Dashboards`.

10. In the terminal, start the OpenSearch Dashboards application by typing:
```bash
yarn start:docker
```

11. Now that OpenSearch Dashboards is running, you should be able to see a log line similar to `[info][server][OpenSearchDashboards][http] http server running at http://0.0.0.0:5603/dog`.
    * The last three letters `dog` are randomly generated every time we start dashboards.

12. Wait for the optimizer to run, which takes about 100s - 200s. Once the optimizer is finished running, it will show a line such as `[success][@osd/optimizer] 48 bundles compiled successfully after 204.9 sec, watching for changes`.

13. Then paste the link into a chrome browser and view dashboard running in browser, but change ‘0.0.0.0’ to ‘localhost’. So here the link should be `http://localhost:5603/dog`.
    * Files are constantly watched, so when you make code changes, OpenSearch Dashboards will rebuild and restart automatically. Refresh the link in the browser and the new changes should be applied.

14. `Git` is already configured in the `entrypoint.sh` file, and the remote is already tracking the fork repository. You can start contributing by creating your branch off the main, and commit your first PR!

# Debug Functional Tests
This section explains how to run Selenium functional tests using Docker and debug the tests through browser interaction.

1. Install a VNC viewer, such as [RealVNC](https://www.realvnc.com/en/connect/download/viewer/), if you haven't already. You'll need to set up a free account to use RealVNC. This VNC viewer will enable you to view and interact with the browser running the Selenium tests. The subsequent steps will illustrate the setup process using RealVNC as an example.

2. Make sure you have completed steps 1-5 in the [Docker Development Environment Setup](#docker-development-environment-setup). Now, ensure you have 5 files, `docker-compose.yml`, `docker-compose.selenium.yml`, `Dockerfile.selenium`, `entrypoint.sh` and `start-vnc.sh`. You can also download them by running the installer script. This time you need to pass a parameter `--ftr`.

```bash
curl -o- https://raw.githubusercontent.com/opensearch-project/OpenSearch-Dashboards/main/dev-tools/install-docker-dev.sh | bash -s -- --ftr
```

3. In the terminal, run the following commands to stop any running containers, build the new configuration, and start the containers:

```bash
docker-compose -f docker-compose.yml -f docker-compose.selenium.yml down
docker-compose -f docker-compose.yml -f docker-compose.selenium.yml up -d --build
```

4. Under the Docker tab in VS Code, you should see three containers running: `opensearchproject/opensearch:latest`, `abbyhu/opensearch-dashboards-dev:latest`, and `selenium-test`.

5. First, right-click on `opensearch-dashboards-docker-dev-selenium-test` (which we'll refer to as `selenium-test` for simplicity) and choose `Attach Visual Studio Code`. This action mirrors [Step 8](#install-step-8) from the [Docker Development Environment Setup](#docker-development-environment-setup). By doing this, you'll be able to edit the functional test directly within the `selenium-test` container using VS Code which is located at `test/functional`.

6. Connect to the VNC server running in the Docker container. First, launch the VNC viewer, then enter `localhost:5900` at the top and press return. You will see a popup window labeled `Unencrypted connection`; click continue. Enter the password (the default password is 123), which is configured in `start-vnc.sh`.

7. After entering the VNC viewer, click the menu at the bottom left. Then click `Internet` to ensure Google works. Also, click `System Tools` and select `LXTerminal` to verify you can type in the terminal. The default terminal path should be `/docker-workspace/OpenSearch-Dashboards`.

8. Run OpenSearch and OpenSearch Dashboards separately before running functional tests. This can help isolate the functional test process and confirm that any issues are caused only by the functional test. Follow these steps:
   * First, start OpenSearch by executing `yarn opensearch snapshot` in one terminal.
   * In a second terminal, run `yarn start --no-base-path` to start OpenSearch Dashboards on port 5601.
   * Make sure OpenSearch Dashboards is running on port 5601 before running any functional tests.

   Please note that the initial startup process may take 2 to 10 minutes, as it requires all the bundles to be assembled. This only occurs the first time you run it; afterward, everything is cached, significantly reducing the startup time for OpenSearch Dashboards. The initial bundling speed is dependent on your hardware limitations and VNC settings. Feel free to make adjustments to improve the process as needed.

9. Open a separate terminal and update Chromedriver by executing `node scripts/upgrade_chromedriver.js`, followed by `yarn osd bootstrap`. This will update the Chromedriver version within the node_modules directory, allowing you to use a compatible version with your installed Google Chrome.

10. To run functional tests, please refer to the [Functional tests section](../../TESTING.md#functional-tests) in the `TESTING.md` file.

11. The Selenium tests will be executed in the browser, viewable through the VNC viewer. You can monitor the test progress in real-time.
