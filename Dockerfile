# Docwright API + GitHub MCP binary (Railway; no Docker-in-Docker)
FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
COPY action/package.json action/
COPY apps/web/package.json apps/web/

RUN npm ci

COPY packages/core packages/core
COPY apps/api apps/api
COPY templates templates

RUN npm run build -w @docwright/core && npm run build -w @docwright/api \
  && npm prune --omit=dev

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

ARG MCP_VERSION=v1.6.0
RUN curl -fsSL -o /tmp/mcp.tgz \
    "https://github.com/github/github-mcp-server/releases/download/${MCP_VERSION}/github-mcp-server_Linux_x86_64.tar.gz" \
  && tar -xzf /tmp/mcp.tgz -C /usr/local/bin \
  && chmod +x /usr/local/bin/github-mcp-server \
  && rm /tmp/mcp.tgz

ENV NODE_ENV=production
ENV DOCWRIGHT_MCP_COMMAND=/usr/local/bin/github-mcp-server
ENV DOCWRIGHT_MCP_ARGS=["stdio"]
ENV PORT=8080

COPY --from=build /app /app

EXPOSE 8080
CMD ["npm", "run", "start", "-w", "@docwright/api"]
