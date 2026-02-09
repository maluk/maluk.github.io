# Use Node.js 18 as the base image for the build stage, matching the GitHub Action
FROM node:18-alpine as build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
# The workflow has explicit installs, but npm install should cover dependencies in package.json
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
# Setting NODE_OPTIONS=--openssl-legacy-provider as seen in the GitHub Action
# This is required for older react-scripts on newer Node versions
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

# --- Kardbrd Agent Stage ---
FROM build AS agent

# Install system dependencies
# python3: required for uv/agent
# git, openssh: for git operations
# shadow: for user management (optional if using alpine's adduser, but good for compatibility)
# bash: used as shell
RUN apk add --no-cache python3 git openssh bash

# Install Claude CLI
RUN npm install -g @anthropic-ai/claude-code

# Install uv (Python package manager)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY --from=ghcr.io/astral-sh/uv:latest /uvx /usr/local/bin/uvx

# Create agent user
# -D: don't assign a password
# -u 1000: fixed UID
# -s /bin/bash: set shell
# Note: node images come with a 'node' user at UID 1000, so we delete it first to avoid conflict
RUN (deluser node || true) && \
    adduser -D -u 1000 -s /bin/bash agent && \
    mkdir -p /app/state && \
    chown agent:agent /app/state

USER agent
WORKDIR /home/agent/repository

# Entrypoint for the agent
ENTRYPOINT ["uvx", "--from", "git+https://github.com/kardbrd/kardbrd-agent.git", "kardbrd-agent"]
CMD ["start", "--cwd", "/home/agent/repository"]

# --- Production Serve Stage ---
# Use Nginx to serve the static files
FROM nginx:alpine

# Copy the build output from the build stage to the Nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
