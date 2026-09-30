# Proposal

## Why

The documented local development workflow starts the React client in Vite and the API in Express, but Vite currently forwards the client's `/api.ts` module request to Express because the proxy prefix overlaps that root-level module name. The request fails with 404 before React mounts, leaving participants with a blank page; this needs to be fixed before the local feedback-board workflow can be used reliably.

## What Changes

- Require the local development client to load and render when a client module path shares a prefix with a backend API route.
- Require backend API paths to continue proxying to the development API server.
- Add an automated development-server regression check covering both client-module delivery and API forwarding.

**Non-goals:** Changing deployed routes, API behavior, the React application, dependency versions, or Azure/GitHub deployment configuration.

## Capabilities

### New Capabilities

- `local-development`: Define the observable behavior required for the local client and API development servers to coexist without intercepting client module requests.

### Modified Capabilities

None. No published capability spec currently covers local development server routing.

## Impact

- **Application/configuration:** Vite development proxy configuration only; no production API or browser behavior changes beyond restoring the already-intended local client startup.
- **Tests:** Add a focused integration test that exercises a real Vite server against a local API stand-in and verifies the client module response and forwarded API request.
- **Infrastructure, dependencies, workflows, and security:** No changes; no new dependencies or permissions.
- **Documentation:** No change required because existing local startup instructions remain correct after the defect is fixed.
