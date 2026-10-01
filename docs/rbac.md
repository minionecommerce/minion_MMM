# User Management & RBAC

## Where things live
| Concern | File |
|---|---|
| Modules, actions, route → module map, sidebar items | `src/lib/rbac/catalog.ts` |
| Effective-permission rules | `src/lib/rbac/effective.ts` |
| Login, sessions, Data Access Layer (`requirePermission`, `requirePageAccess`, `authorizeAction`) | `src/lib/auth.ts` |
| Optimistic route checks (cookie only) | `proxy.ts` |
| User/role mutations and all anti-escalation rules | `src/lib/users/service.ts` |
| Security audit log | `src/lib/audit.ts` → `SecurityAuditLog` table |
| Sync catalog into a database | `scripts/rbac-sync.ts` |
| Bootstrap first Super Admin | `scripts/seed-rbac-v2.ts` |

## Permission model
Permissions are `module.action`, e.g. `leads.edit`. Actions: view, create, edit, delete, approve, export.

Effective permissions (later layers win for the same key):
1. **Role** grants: ALLOW adds, DENY removes
2. **User overrides** (`EmployeePermissionOverride`): ALLOW adds, DENY removes
3. **Temporary permissions** (only while active): ALLOW adds, DENY removes
4. Any action other than View implies View — unless View was explicitly denied, which removes the whole module.

Examples: Role = View, user override Edit=ALLOW → View + Edit. Role = View+Edit, user override Edit=DENY → View.

**Super Admin** role (`Role.isSuperAdmin`) and **Full Administrator** (`User.isAdmin`) have every permission.
Only a Super Admin can assign either, or manage accounts that have them.

## Enforcement layers
1. `proxy.ts` — signed in? session valid? password change required? route allowed by the session snapshot? (no DB)
2. Every page calls `requirePageAccess([...modules])`
3. Every server action calls `authorizeAction(module, action)` / `requirePermission(...)`; every API route goes through `withAuthRoute` + the service layer
4. The DAL re-reads the user from the database on every request: status must be ACTIVE and `sessionVersion` must match the session, so deactivation and password resets take effect immediately.

## Anti-escalation rules (server-side)
- No changes to your own role, permissions, admin flag or status; no deleting yourself
- You can only grant permissions you hold (grant ceiling), including via roles
- You can only manage accounts whose effective permissions are a subset of yours
- You cannot edit the permissions of the role assigned to you (unless Super Admin)
- The last active Super Admin cannot be deactivated, demoted or deleted
- API payloads are validated with strict schemas; unknown fields are rejected

## Sessions & passwords
- bcrypt (cost 12); hashes are never selected into responses (`SAFE_USER_SELECT`)
- Session: 12 h, or 30 days with "Remember me"; permission snapshot refreshed every minute
- 5 failed logins → 15 min lockout; 20 failures per IP per 15 min → throttled
- Admin reset → one-time temporary password, forced change at next sign-in, all sessions ended
- Changing your own password ends all sessions

## Adding a module
Add it to `MODULES` (and `ROUTE_MODULES` / `NAV_ITEMS` if it has pages), run `npx tsx scripts/rbac-sync.ts`,
then protect its pages with `requirePageAccess` and its actions with `authorizeAction`.
