# Next.js web app.
#
# This was a Python-and-Node image that compiled pyswisseph and shipped
# build-essential, a habit from when a route here spawned calc_chart.py as a
# FastAPI fallback. That fallback is gone from the code (see
# apps/web/src/lib/api/proxy.ts), so the Python half only slowed every build —
# compiling C under QEMU was most of the old 20-minute arm64 build — and
# fattened the runtime image with compilers it never ran.

FROM node:20-slim AS build

WORKDIR /app

# Dependencies first, in their own layer: application code changes on every
# commit, the lockfile does not, so npm ci stays cached.
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/
RUN npm --prefix apps/web ci

COPY . .

# Next.js inlines NEXT_PUBLIC_* at build time — supplying them only at run
# time leaves the features invisible. The Google client id is public by
# design; the browser must send it.
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_UMAMI_HOST
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    NEXT_PUBLIC_UMAMI_HOST=$NEXT_PUBLIC_UMAMI_HOST \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

RUN npm --prefix apps/web run build


FROM node:20-slim AS runtime

WORKDIR /app

# Only the app and its modules — no compilers, no repo, no Python.
COPY --from=build /app/apps/web /app/apps/web

ENV PORT=3000 \
    NODE_ENV=production

EXPOSE 3000

CMD ["npm", "--prefix", "apps/web", "start"]
