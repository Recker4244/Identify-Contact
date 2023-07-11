
## Project setup

- Clone the repository and navigate to the project directory.
- Perform `npm install` at command line.
- Create an empty postgres database.
- Define the environment variables in a `.env` file like below:
```
POSTGRESQL_DB_NAME=<database name to connect to>
DB_USER=<username to be used for database>
DB_PASS=<password to be used for database>
DB_HOST=<hostname to connect to for database>
```
- Run the command `npm run start` to run migrations, seed the database and start the server in development mode. This starts `nodemon`, which restarts the server for any changes in the source files.
- For auth token to send in API `Authorization` header:
  - Select a `name` from the `users` table in database
  - Encode the `name` to base64 from command line. Eg: `echo -n 'Aishwarya N' | base64`