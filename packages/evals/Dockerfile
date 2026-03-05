# ---------- Stage 1: builder ----------
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files first (layer caching)
COPY package.json package-lock.json ./

# Copy workspace package files
COPY packages/skills-build/package.json packages/skills-build/
COPY packages/evals/package.json packages/evals/

# Install all dependencies
RUN npm install && \
    npm --prefix packages/skills-build install && \
    npm --prefix packages/evals install

# Copy source code
COPY skills/ skills/
COPY packages/skills-build/ packages/skills-build/
COPY packages/evals/ packages/evals/

# Build skills (generates AGENTS.md / CLAUDE.md files)
RUN npm --prefix packages/skills-build run build

# ---------- Stage 2: runtime ----------
FROM node:22-slim

# Install Docker CLI, and curl (needed for supabase CLI install)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install supabase CLI binary (pinned version)
ARG SUPABASE_CLI_VERSION=2.67.1
RUN ARCH=$(dpkg --print-architecture) && \
    case "$ARCH" in \
      amd64) SUPABASE_ARCH="linux_amd64" ;; \
      arm64) SUPABASE_ARCH="linux_arm64" ;; \
      *) echo "Unsupported arch: $ARCH" && exit 1 ;; \
    esac && \
    curl -fsSL "https://github.com/supabase/cli/releases/download/v${SUPABASE_CLI_VERSION}/supabase_${SUPABASE_ARCH}.tar.gz" \
      | tar xz -C /usr/local/bin supabase && \
    chmod +x /usr/local/bin/supabase

WORKDIR /app

# Use the existing node user (UID 1000) — Claude Code refuses --dangerously-skip-permissions as root.
# Add node user to the docker group so it can reach the mounted Docker socket.
# DOCKER_GID must match the host's docker group GID (default 999 on most Linux systems).
ARG DOCKER_GID=999
RUN groupadd -f -g ${DOCKER_GID} docker && usermod -aG docker node

# Copy built artifacts from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules/ node_modules/
COPY --from=builder /app/skills/ skills/
COPY --from=builder /app/packages/skills-build/ packages/skills-build/
COPY --from=builder /app/packages/evals/ packages/evals/

# Install entrypoint
COPY packages/evals/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create results directory writable by node user
RUN mkdir -p /app/packages/evals/results && chown -R node:node /app/packages/evals/results

# Ensure node user owns tmp and home for Claude Code
RUN mkdir -p /tmp && chmod 1777 /tmp && chown -R node:node /home/node

USER node

ENV IN_DOCKER=true
ENV NODE_ENV=production

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "--prefix", "packages/evals", "run", "eval"]
