# Code Review Comments

## 1. Auto-save state captured at session creation
- **File:** `backend/src/services/SessionManager.ts`
- **Issue:** When the session is created, the `sessionData` object is read once and captured by the event listeners. If the `autoSaveEnabled` flag is toggled later via the API, the `parsed_output` handler keeps using the stale value, so responses may still be saved (or skipped) against the user's new preference.
- **Recommendation:** Look up the latest session record inside the listener (or have the session object expose the updated state) before deciding to persist messages. Alternatively, refresh the cached `sessionData` whenever session settings change.

## 2. Unvalidated pagination parameters in message query
- **File:** `backend/src/api/sessions.ts`
- **Issue:** `limit` and `offset` query parameters are parsed with `parseInt` and interpolated directly into the SQL string in `MessageModel.findBySessionId`. Invalid values (e.g., `limit=foo`) turn into `NaN`, leading to SQL such as `LIMIT NaN`, which causes SQLite to throw and returns a 500 error.
- **Recommendation:** Validate that the parsed numbers are finite and non-negative before passing them to the model. Reject bad inputs with a 400 response or fall back to safe defaults. Prefer using prepared statement parameters instead of string interpolation to avoid this class of issues entirely.

## 3. `npm run dev` fails because `tsx` is unavailable on some setups
- **File:** `backend/package.json`
- **Issue:** The dev script invokes the `tsx` binary, but `tsx` is only listed under `devDependencies`. On environments where dependencies are installed with `--omit=dev` (common on Windows or production deployments), the binary is missing, so `npm run dev` fails with `'tsx' is not recognized as an internal or external command'.
- **Recommendation:** Either move `tsx` to `dependencies`, document that developers must install dev dependencies, or change the script to call it via `npx tsx` so it works even when the binary isn't on the PATH.
