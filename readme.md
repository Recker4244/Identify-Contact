
## Project setup

- Clone the repository and navigate to the project directory.
- Perform `npm install` at command line.
- Create an empty postgres database.
- Define the environment variables in the `docker-compose.yml` file like below:
```
PORT=<port to be used for exposing the app>
DB_PORT=<port to be used to connect to database>
POSTGRESQL_DB_NAME=<database name to connect to>
DB_USER=<username to be used for database>
DB_PASS=<password to be used for database>
DB_HOST=<hostname to connect to for database>
```
- Open your command line interface and navigate to the root directory of the cloned repository.
- Run the following command to build and start the containers:
```
docker-compose up --build
```
- Once the containers are up and running, you can access the Express application in your web browser at http://localhost:3000(If you did not change the port)
- To stop the running containers, use the keyboard shortcut Ctrl + C in the command line interface.