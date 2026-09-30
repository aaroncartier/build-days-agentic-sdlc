# Design

## Context

See [proposal.md](proposal.md) for the problem and [specs/local-development/spec.md](specs/local-development/spec.md) for the behavior contract. The Vite development server serves the client from `src/client`, where `api.ts` is a root-level module imported by the React app. The same server proxies backend API calls to Express on port 3000. Root `DESIGN.md` requires a clear frontend/API boundary and deterministic, independently verifiable behavior.

## Goals / Non-Goals

**Goals:**

- Ensure module requests remain owned by the client server unless they are backend API paths.
- Preserve existing `/api/feedback` development behavior.
- Reproduce the real Vite proxy interaction in a deterministic regression test without depending on an already-running local API process.

**Non-Goals:**

- Change Express routes, API contracts, client module naming, production static hosting, or the deployment architecture.

## Decisions

1. **Match the API route boundary rather than its bare prefix.** Change the Vite proxy context from `/api` to `/api/`. Vite's prefix matching currently treats `/api.ts` as a match for `/api`; requiring the slash reserves proxying for paths in the API namespace. Renaming `api.ts` or moving it below a different directory was rejected because it changes client structure to work around an imprecise route boundary.

2. **Test the actual development server boundary.** Start an ephemeral Vite server using the repository configuration and a local HTTP upstream stand-in. Assert `/api.ts` is served as JavaScript by Vite, `/api/feedback` is sent to the upstream, and only the backend request reaches that upstream. A config-string assertion alone was rejected because it would not verify Vite's path matching behavior.

## Risks / Trade-offs

- **The bare `/api` path will not be proxied by the slash-delimited rule.** The application exposes backend endpoints beneath `/api/`; if a bare `/api` endpoint is added, explicitly route or redirect it and add a test rather than broadening the prefix again.
- **The integration test opens local ephemeral HTTP servers.** Bind both servers to loopback and select an operating-system-assigned port to avoid external access and fixed-port collisions.

## Migration Plan

No migration is required. Restart the Vite client development server to load the updated configuration. Rollback is a one-line proxy-context restoration, but doing so restores the blank-page failure and should only occur with an alternative route-boundary fix.

No durable architecture change is introduced, so root `DESIGN.md` does not need an update.
