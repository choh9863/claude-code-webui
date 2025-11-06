# Code Review Comments

## 1. Auto-save state captured at session creation
- **File:** `backend/src/services/SessionManager.ts`
- **Issue:** When the session is created, the `sessionData` object is read once and captured by the event listeners. If the `autoSaveEnabled` flag is toggled later via the API, the `parsed_output` handler keeps using the stale value, so responses may still be saved (or skipped) against the user's new preference.
- **Recommendation:** Look up the latest session record inside the listener (or have the session object expose the updated state) before deciding to persist messages. Alternatively, refresh the cached `sessionData` whenever session settings change.

## 2. Unvalidated pagination parameters in message query
- **File:** `backend/src/api/sessions.ts`
- **Issue:** `limit` and `offset` query parameters are parsed with `parseInt` and interpolated directly into the SQL string in `MessageModel.findBySessionId`. Invalid values (e.g., `limit=foo`) turn into `NaN`, leading to SQL such as `LIMIT NaN`, which causes SQLite to throw and returns a 500 error.
- **Recommendation:** Validate that the parsed numbers are finite and non-negative before passing them to the model. Reject bad inputs with a 400 response or fall back to safe defaults. Prefer using prepared statement parameters instead of string interpolation to avoid this class of issues entirely.

## 3. Windows install fails because `node-pty` needs extra build tooling
- **File:** `backend/package.json`
- **Issue:** Pulling in `node-pty@^1.0.0` as a hard dependency forces npm to compile the native addon when no prebuilt binary matches the runtime (Node 22 on Windows). That triggers `node-gyp rebuild`, which in turn fails unless the developer installs the optional MSVC Spectre mitigation libraries mentioned in the log. The resulting `npm install` error is coming from the missing toolchain, not from the user's machine specifically.
- **Recommendation:** Either document the additional Visual Studio components that Windows contributors must install, pin Node to a version for which `node-pty` ships prebuilt binaries, or swap in a prebuilt-friendly fork such as `node-pty-prebuilt-multiarch` so `npm install` succeeds without manual toolchain setup.

## 4. Background sessions drop streamed updates in the UI
- **File:** `frontend/src/App.tsx`
- **Issue:** The WebSocket handlers only append message chunks when `data.sessionId === currentSessionId`. If a reply streams in for a tab that isn't currently focused, those chunks are ignored, so the chat history for that session never updates. When the user switches back, the transcript is missing the assistant's reply unless they manually reload it from the server.
- **Recommendation:** Track streamed chunks per session rather than just the active one—e.g., append to whatever session ID the event reports, and only gate UI concerns (like scrolling) on the focused tab. That keeps background sessions in sync.
