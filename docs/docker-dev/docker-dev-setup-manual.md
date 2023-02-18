# Docker Development Environment Setup

1. Install [Docker](https://docs.docker.com/get-docker/) if not already.
2. On the terminal, run command `curl -o- https://raw.githubusercontent.com/opensearch-project/OpenSearch-Dashboards/main/dev-tools/install-docker-dev.sh | bash`. This should create a folder named `opensearch-dashboards-docker-dev` and it should contain two files: `docker-compose.yml` and `entrypoint.sh`.
3. Open [VsCode](https://code.visualstudio.com/download). Install here if not already. Make sure VsCode has the extension `Dev Containers` and `Docker` installed. If not, go to Extensions tab, search and install them.
4. Under the Discover tab, click `Open Folder`, and open the `opensearch-dashboards-docker-dev` folder that we just created.
5. In the workspace folder, set environment variable for the fork repository URL: run `export REPO_URL=[insert your fork repo url here]`. If fork repo has not been created: Go to [OpenSearch Dashboards github page](https://github.com/opensearch-project/OpenSearch-Dashboards) and under fork, select create a new fork, and then copy the https link of the fork url and use it in the above command.
6. To run the `docker-compose.yml` file in the background, and type `docker compose up -d --build` in the terminal.
7. Under `Docker` tab in VsCode, verify that there are two containers running: `opensearchproject/opensearch:latest` and `docker.io/library/osd-development`. We can also verify using the command line: `docker ps`.
8. Right click `docker.io/library/osd-development`, and select `Attach Visual Studio Code`. This should ssh into the container in another VsCode window.
9. For the new VsCode window, if it is not showing the repository code, then select `Open Folder`. Then open `/workspace-docker/OpenSearch-Dashboards`.
10. In the terminal, type  `yarn start:docker` to start the OpenSearch Dashboards application.  (To open a terminal, right click on a file and click `Open in Integrated Terminal`. Then change the terminal type to bash by clicking the + sign on the right top of the terminal window.)
11. Now dashboard is running, you should be able to see a similar line `[info][server][OpenSearchDashboards][http] http server running at http://0.0.0.0:5603/dog` . The last three letters are randomly generated every time we start dashboards.
12. Wait for the optimizer to run, and it takes about 100s - 200s. Once the optimizer is finished running, it will show a line such as `[success][@osd/optimizer] 48 bundles compiled successfully after 204.9 sec, watching for changes`.
13. Then paste the link into a chrome browser and view dashboard running in browser, but change ‘0.0.0.0’ to ‘localhost’. So here the link should be `http://localhost:5603/dog`.
14. Changes are constantly being watched, so when there is changes made, dashboard will rebuild and restart automatically. Refresh the link in the browser and the new changes should be applied.
15. `Git` is already configured in the `entrypoint.sh` file, and the remote is already tracking the fork repository. You can start contributing by creating your branch off the main, and commit your first PR!

