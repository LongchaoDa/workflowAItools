# QA Iteration Checklist

## Iteration 1 (2026-03-08)
Account used for auth flow tests: `dalongchao@gmail.com`

| # | Feature | Result | Notes |
|---|---|---|---|
| 1 | Health check (`GET /health`) | PASS | 200 |
| 2 | Create user (`POST /api/auth/register`) | PASS | 201 (created) |
| 3 | Login (`POST /api/auth/login`) | PASS | 200 |
| 4 | Search public workflows (`GET /api/community/search`) | PASS | 200, results returned |
| 5 | List workflow examples (`GET /api/workflows/examples`) | PASS | 200, results returned |
| 6 | Get workflow example detail (`GET /api/workflows/examples/:slug`) | PASS | 200, stages returned |
| 7 | Fetch media asset (`GET /media/...`) | PASS | 200 |
| 8 | Create public workflow note (`POST /api/notes`) | PASS | 201 |
| 9 | Create private workflow note (`POST /api/notes`) | PASS | 201 |
| 10 | List my notes (`GET /api/notes/mine`) | PASS | 200, both notes found |
| 11 | Read public note detail without auth (`GET /api/notes/:id`) | PASS | 200 |
| 12 | Read private note detail without auth (`GET /api/notes/:id`) | PASS | 403 (expected) |
| 13 | Read private note detail as owner (`GET /api/notes/:id`) | PASS | 200 |
| 14 | Patch note (`PATCH /api/notes/:id`) | PASS | 200 |
| 15 | Unauthorized create note should fail | PASS | 401 (expected) |
| 16 | Bookmark note (`POST /api/community/bookmarks/:noteId`) | PASS | 201 |
| 17 | List bookmarks (`GET /api/community/bookmarks`) | PASS | 200, note found |

## Fixes applied in this iteration
- Reworked frontend to a clean Notion-style light UI with blue-gray palette.
- Improved auth and API error feedback so failures show real backend messages.
- Added explicit QA account autofill on auth page for repeatable checks.
- Improved empty states and status handling in dashboard/bookmarks/create pages.

## Remaining failures
- None in iteration 1.

## Next iteration trigger
- Run the same checklist after any backend route or frontend form change.

## Iteration 2 (2026-03-08)

### Expanded API matrix (before fix)
Total: 21, Passed: 19, Failed: 2

Failed items:
- Bookmark nonexistent note should fail: **FAILED** (actual 201, expected 404)
- Bookmark private note by non-owner should fail: **FAILED** (actual 201, expected 403/404)

Root cause:
- `POST /api/community/bookmarks/:noteId` lacked note existence and visibility validation.

### Additional regression finding (before fix)
`dalongchao@gmail.com` login unexpectedly failed (401) after running test suite.

Root cause:
- Tests called `resetDb()` against the same dev database file (`db.json`), so test execution could wipe runtime data.

### Fixes applied in iteration 2
- Backend route hardening:
  - `POST /api/community/bookmarks/:noteId` now validates:
    - note exists (`404` if not found)
    - note is not private (`403`)
    - note is published (`400` if draft)
- Data isolation:
  - Database path now separates test and dev data:
    - dev: `backend/src/data/db.json`
    - test: `backend/src/data/db.test.json`
- Added automated regression test:
  - `backend/tests/communityRoutes.test.ts`
- Updated backend test command:
  - `vitest run tests/*.test.ts`

### Expanded API matrix (after fix)
Total: 21, Passed: 21, Failed: 0

### Specified account regression (`dalongchao@gmail.com / dalongchao1`)
Total: 7, Passed: 7, Failed: 0

Validated items:
- Ensure account exists (register if needed)
- Login
- Create workflow note
- Verify note in my notes
- Verify note searchable in public search
- Bookmark note
- Verify bookmark list contains note
