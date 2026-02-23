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

RUN apt-get update && apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Use the existing node user (UID 1000) — Claude Code refuses --dangerously-skip-permissions as root
# node:22-slim already ships with user "node" (uid=1000, gid=1000)

# Copy built artifacts from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules/ node_modules/
COPY --from=builder /app/skills/ skills/
COPY --from=builder /app/packages/skills-build/ packages/skills-build/
COPY --from=builder /app/packages/evals/ packages/evals/

# Install mock scripts
COPY packages/evals/mocks/supabase /usr/local/bin/supabase
COPY packages/evals/mocks/docker /usr/local/bin/docker
COPY packages/evals/mocks/psql /usr/local/bin/psql
RUN chmod +x /usr/local/bin/supabase /usr/local/bin/docker /usr/local/bin/psql

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
