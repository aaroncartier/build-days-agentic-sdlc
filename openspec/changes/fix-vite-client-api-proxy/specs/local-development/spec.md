# Spec Delta

## Purpose

This capability defines reliable local startup for the browser client and API, including routing that keeps client modules available while backend requests are forwarded to the API service.

## ADDED Requirements

### Requirement: Local client and API routing

The local development environment SHALL serve browser client entry points and modules from the client development server while forwarding backend API requests to the API service, even when a client module path shares a string prefix with an API route.

#### Scenario: Client module path overlaps an API prefix

- **WHEN** the browser requests the client module at `/api.ts` during local development
- **THEN** the client development server returns the JavaScript module and the application can mount instead of receiving an API-server not-found response

#### Scenario: Browser requests a backend API route

- **WHEN** the browser requests a backend route beneath `/api/` during local development
- **THEN** the request is forwarded to the API service and its response is returned to the browser
