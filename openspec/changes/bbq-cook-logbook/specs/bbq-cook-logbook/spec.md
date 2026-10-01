# Spec Delta

## Purpose

The BBQ Cook Logbook lets a team record each BBQ cook attempt with its
preparation, cooking observations, and scored outcome, then revisit saved
attempts as a practical record of what was cooked.

## ADDED Requirements

### Requirement: Record a complete cook attempt

The application SHALL let a user create one Cook Log for one cook attempt.
Each saved log SHALL capture meat type; initial and trimmed meat weights in
kilograms; seasonings; ordered preparation steps; ordered intermediate cook
events and observations; total cook time in minutes; final observations; and
separate integer ratings from 1 through 5 for appearance, taste, and texture.
A Cook Log SHALL preserve the entered preparation and cook-event order and
represent the attempt as one self-contained record.

#### Scenario: Save a cook attempt

- **WHEN** a user submits a valid cook log with its meat, weights, seasonings,
  preparation, cook events, cook time, observations, and ratings
- **THEN** the application saves one record containing those values, the
  preparation and cook-event ordering, and all three distinct ratings

#### Scenario: Record an unseasoned cook

- **WHEN** a user records a cook attempt that used no seasonings
- **THEN** the saved log represents an empty seasoning list without rejecting
  the attempt or inventing a seasoning

#### Scenario: Review intermediate events in entered order

- **WHEN** a saved log has multiple intermediate cook events
- **THEN** the application presents those events in the order the user entered
  them, with their associated observations

### Requirement: Validate cook log values

The application SHALL reject a cook log with missing required values or values
outside the supported ranges. Initial and trimmed weights SHALL be positive
kilogram values, and trimmed weight SHALL NOT exceed initial weight. Total cook
time SHALL be a positive number of minutes. Appearance, taste, and texture
ratings SHALL each be an integer from 1 through 5. Rejected values SHALL NOT
create or alter a saved log.

#### Scenario: Reject an invalid weight or rating

- **WHEN** a user submits a non-positive weight, a trimmed weight greater than
  the initial weight, or a rating outside the integer range 1 through 5
- **THEN** the application identifies the invalid field and does not save the
  cook log

#### Scenario: Reject an incomplete or invalid cook time

- **WHEN** a user submits a cook log without a meat type, required weight,
  preparation step, or rating, or with a non-positive cook time
- **THEN** the application identifies the missing or invalid value and does
  not save the cook log

### Requirement: Browse and review saved cook logs

The application SHALL allow a user to retrieve and review saved cook logs,
including all recorded preparation, cook-event, observation, and rating values.
When configured with durable storage, saved logs SHALL remain available after
the application is restarted. The local in-memory mode is ephemeral and SHALL
not claim to preserve logs across a server restart.

#### Scenario: Browse and review attempts with durable storage

- **WHEN** a user opens the cook logbook after saving one or more logs to
  configured durable storage, including after an application restart
- **THEN** the application displays the saved attempts and lets the user inspect
  each complete record

#### Scenario: Show an empty logbook

- **WHEN** a user opens the logbook and no attempts have been saved
- **THEN** the application presents a clear empty state and a path to create the
  first cook log

#### Scenario: Use the local in-memory backend

- **WHEN** a user runs the application with its local in-memory backend
- **THEN** the user can create, browse, and review logs while that server
  process is running, and the application does not claim those logs survive a
  server restart

### Requirement: Provide accessible cook log interaction

The browser interface SHALL support the primary create-and-review workflow
with programmatically associated labels, keyboard-operable controls, and
accessible loading, empty, success, validation, and failure states.

#### Scenario: Complete the workflow using a keyboard

- **WHEN** a user navigates the create-and-review workflow using only a
  keyboard
- **THEN** the user can enter the log, identify invalid fields, submit valid
  data, and reach the saved log without requiring pointer input

#### Scenario: Receive accessible validation feedback

- **WHEN** a submission contains invalid values
- **THEN** the affected fields and their errors are programmatically
  identifiable and the user is informed that the log was not saved

#### Scenario: Receive accessible service failure feedback

- **WHEN** loading or saving a cook log fails because the application or
  storage service is unavailable
- **THEN** the user is informed through an accessible failure state, entered
  values remain available for retry, and the application does not report the
  log as saved

### Requirement: Expose application health and readiness

The application SHALL expose liveness and dependency-aware readiness results.
Liveness SHALL indicate whether the application process can respond.
Readiness SHALL indicate whether required durable storage is usable and SHALL
report not-ready when that dependency is unavailable.

#### Scenario: Storage is unavailable

- **WHEN** the application process responds but its required durable storage
  cannot be used
- **THEN** liveness remains successful and readiness reports not-ready without
  disclosing sensitive dependency details
