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

8. Right-click `abbyhu/opensearch-dashboards-dev:latest`, and select `Attach Visual Studio Code`. 
    * This will ssh into the container and you will be able to view and edit the files using VS Code as the code editor. 
    * If you do not wish to use VS Code as the code editor, the alternative way of ssh into the container is by using the command below: 
    ```bash
    docker exec -it dev-env /bin/bash
    ```

9. For the new VS Code window, if it is not showing the repository code, then select `Open Folder`. Then open `/workspace-docker/OpenSearch-Dashboards`.

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
