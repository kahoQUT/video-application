Assignment 1 - REST API Project - Response to Criteria
================================================

Overview
------------------------------------------------

- **Name:** Ka Ho Lau
- **Student number:** n12104353
- **Application name:** Video App
- **Two line description:** This app runs a stabilisation algorithm on videos that users have uploaded.  
Users can then view or download their original videos and the stabilised videos.

- The project is using ChatGPT code snippets.

Core criteria
------------------------------------------------

### Containerise the app

- **ECR Repository name:** n12104353-a1
- **Video timestamp:**
- **Relevant files:**
    - /Dockerfile

### Deploy the container

- **EC2 instance ID:**
- **Video timestamp:**

### User login

- **One line description:** Hard-coded username/password list.  Using JWTs for sessions.
- **Video timestamp:**
- **Relevant files:**
    - /routes/

### REST API

- **One line description:** REST API with endpoints (as nouns) and HTTP methods (GET, POST, PUT, DELETE), and appropriate status codes
- **Video timestamp:**
- **Relevant files:**
    - 

### Data types

- **One line description:** 
- **Video timestamp:** 
- **Relevant files:**
    - 

#### First kind

- **One line description:** Video files
- **Type:** Unstructured
- **Rationale:** Videos are too large for database.  No need for additional functionality.
- **Video timestamp:**
- **Relevant files:**
    - /storage

#### Second kind

- **One line description:** File metadata, user ownership of videos
- **Type:** Structured
- **Rationale:**
- **Video timestamp:**
- **Relevant files:**
  - 

### CPU intensive task

 **One line description:** Uses ffmpeg to stabilise shaky video files.
- **Video timestamp:** 
- **Relevant files:**
    - 

### CPU load testing

 **One line description:** Node script to generate requests to stabilise endpoint
- **Video timestamp:** 
- **Relevant files:**
    - 

Additional criteria
------------------------------------------------

### Extensive REST API features

- **One line description:** Use of middleware for advanced HTTP headers
- **Video timestamp:**
- **Relevant files:**
    - /jwt.js
    - /src/routes/fileRoutes.js
    - /src/routes/transcodeRoutes.js

### External API(s)

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 

### Additional types of data

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 

### Custom processing

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 

### Infrastructure as code

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 

### Web client

- **One line description:**
- **Video timestamp:** 
- **Relevant files:**
    - /public/index.html

### Upon request

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 
