FROM node:24-slim
RUN npm install -g @anthropic-ai/claude-code@2.1.63
RUN useradd -m claude
USER claude
RUN mkdir -p /home/claude/.claude
