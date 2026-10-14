# FiberStash Companion Database (Docker & SQLite Setup)

FiberStash is an elegant, full-stack directory registry for beautiful yarn cataloging. It integrates interactive stats, fast weight and search query filters, and a real-time responsive UI with a secure local SQLite archive.

## Docker Deployment with Local SQLite Volume

To host your yarn catalog as a lightweight Docker container while keeping your stash database persistently saved on your host computer, follow the instructions below:

### 1. Build the Docker Image
Navigate to the root folder (where the `Dockerfile` resides) and run:
```bash
docker build -t fiber-stash .
```

### 2. Run the Container with Persistent Storage Mounts
Run the container and map a folder or a directory from your local system (`/path/to/local/storage`) to the container's `/data` directory. 

This ensures that the database file `yarn_stash.db` is saved on your local hard drive and remains fully intact even if the container is restarted or updated:

#### On Linux / macOS:
```bash
docker run -d \
  -p 3000:3000 \
  -v "$(pwd)/data:/data" \
  --name fiber-stash-app \
  fiber-stash
```

#### On Windows (PowerShell):
```bash
docker run -d `
  -p 3000:3000 `
  -v "${PWD}/data:/data" `
  --name fiber-stash-app `
  fiber-stash
```

### 3. Accessing the Application
Once started, the application will boot and link your local database. Open your browser and navigate to:
```
http://localhost:3000
```
Your SQLite storage file will populate and save directly into the local `./data` folder on your machine as `yarn_stash.db`.
