# Tasks

## 1. Development routing and regression coverage

- [ ] 1.1 Narrow the development proxy to backend API paths and verify the existing API routes still reach the server.
- [ ] 1.2 Add a real Vite-server regression test with a loopback API stand-in; verify `/api.ts` returns JavaScript from the client server and `/api/feedback` reaches the stand-in.

## 2. Integration validation

- [ ] 2.1 Run the focused proxy test, application tests, lint, type-check, and production build; verify the local client mounts and the backend API remains functional.
