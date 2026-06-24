FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY scripts/generate-api-docs.mjs ./scripts/
COPY docs/api/openapi.yaml ./docs/api/
RUN pnpm install --frozen-lockfile || pnpm install
COPY apps/web ./apps/web
COPY .prettierrc ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14.2.4
COPY --from=build /app/apps/web/dist ./dist
EXPOSE 4892
CMD ["serve", "-s", "dist", "-l", "4892"]
