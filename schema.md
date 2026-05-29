# LOCKEDIN — Database Schema

> Database schema reference. Update this file whenever the schema changes.

---

## Tables

### `profiles`

Auto-created by `handle_new_user()` trigger on every Supabase auth signup.

| Column       | Type        | Nullable | Default | Notes                                                    |
| ------------ | ----------- | -------- | ------- | -------------------------------------------------------- |
| `id`         | uuid        | NO       | —       | FK → `auth.users(id)` ON DELETE CASCADE                  |
| `username`   | text        | YES      | NULL    | NULL until onboarding; unique; 3–20 chars `^[a-z0-9_]+$` |
| `full_name`  | text        | YES      | NULL    |                                                          |
| `avatar_url` | text        | YES      | NULL    |                                                          |
| `bio`        | text        | YES      | NULL    |                                                          |
| `timezone`   | text        | NO       | `'UTC'` |                                                          |
| `created_at` | timestamptz | NO       | `now()` |                                                          |
| `updated_at` | timestamptz | NO       | `now()` | Auto-updated by `set_updated_at` trigger                 |

**Constraints:** `profiles_username_format` — NULL or 3–20 chars matching `^[a-z0-9_]+$`

---

### `groups`

| Column        | Type        | Nullable | Default             | Notes                                                  |
| ------------- | ----------- | -------- | ------------------- | ------------------------------------------------------ |
| `id`          | uuid        | NO       | `gen_random_uuid()` | PK — **immutable**                                     |
| `name`        | text        | NO       | —                   | Mutable                                                |
| `description` | text        | YES      | NULL                | Mutable                                                |
| `invite_code` | text        | NO       | —                   | UNIQUE; 8-char uppercase alphanumeric — **immutable**  |
| `created_by`  | uuid        | NO       | —                   | FK → `profiles(id)` ON DELETE RESTRICT — **immutable** |
| `created_at`  | timestamptz | NO       | `now()`             | **Immutable**                                          |
| `updated_at`  | timestamptz | NO       | `now()`             | Auto-updated by `set_updated_at` trigger               |

**ON DELETE RESTRICT on `created_by`:** A profile cannot be deleted while it created any group. Build ownership-transfer before allowing account deletion for group creators.

**Immutable columns** blocked by `protect_group_immutable_fields` trigger: `id`, `created_by`, `invite_code`, `created_at`.

**Note:** Do not insert directly. Use `create_group_with_owner()` RPC.

---

### `group_members`

| Column      | Type        | Nullable | Default             | Notes                                                 |
| ----------- | ----------- | -------- | ------------------- | ----------------------------------------------------- |
| `id`        | uuid        | NO       | `gen_random_uuid()` | PK — **immutable**                                    |
| `group_id`  | uuid        | NO       | —                   | FK → `groups(id)` ON DELETE CASCADE — **immutable**   |
| `user_id`   | uuid        | NO       | —                   | FK → `profiles(id)` ON DELETE CASCADE — **immutable** |
| `role`      | text        | NO       | `'member'`          | CHECK IN (`'owner'`, `'member'`) — mutable by owner   |
| `joined_at` | timestamptz | NO       | `now()`             | **Immutable**                                         |

**Constraints:** `UNIQUE(group_id, user_id)`

**Invariant:** Every group always has at least one owner. Enforced by `protect_group_last_owner` trigger.

**Immutable columns** blocked by `protect_group_member_immutable_fields` trigger: `id`, `group_id`, `user_id`, `joined_at`.

**Note:** Do not insert directly. Use `create_group_with_owner()` or `join_group_by_invite()`.

---

### `goals`

Private to owner. Group members cannot see each other's goals.

| Column         | Type        | Nullable | Default             | Notes                                                                                  |
| -------------- | ----------- | -------- | ------------------- | -------------------------------------------------------------------------------------- |
| `id`           | uuid        | NO       | `gen_random_uuid()` | PK                                                                                     |
| `user_id`      | uuid        | NO       | —                   | FK → `profiles(id)` ON DELETE CASCADE                                                  |
| `title`        | text        | NO       | —                   |                                                                                        |
| `description`  | text        | YES      | NULL                |                                                                                        |
| `category`     | text        | NO       | —                   | CHECK IN (`career`, `fitness`, `finance`, `education`, `project`, `personal`, `other`) |
| `target_date`  | date        | YES      | NULL                |                                                                                        |
| `status`       | text        | NO       | `'active'`          | CHECK IN (`active`, `completed`, `paused`, `abandoned`)                                |
| `progress_pct` | int         | NO       | `0`                 | CHECK BETWEEN 0 AND 100                                                                |
| `created_at`   | timestamptz | NO       | `now()`             |                                                                                        |
| `updated_at`   | timestamptz | NO       | `now()`             | Auto-updated by `set_updated_at` trigger                                               |

---

### `monthly_goals`

Monthly milestones within an overarching goal. `month_start` must be the first day of the month.

**Hierarchy:** `goals` → `monthly_goals` → `weekly_tasks`.

| Column         | Type        | Nullable | Default             | Notes                                                   |
| -------------- | ----------- | -------- | ------------------- | ------------------------------------------------------- |
| `id`           | uuid        | NO       | `gen_random_uuid()` | PK                                                      |
| `user_id`      | uuid        | NO       | —                   | FK → `profiles(id)` ON DELETE CASCADE                   |
| `goal_id`      | uuid        | NO       | —                   | FK → `goals(id)` **ON DELETE RESTRICT**                 |
| `month_start`  | date        | NO       | —                   | CHECK EXTRACT(DAY) = 1                                  |
| `title`        | text        | NO       | —                   |                                                         |
| `description`  | text        | YES      | NULL                |                                                         |
| `category`     | text        | YES      | NULL                | Same enum as goals                                      |
| `status`       | text        | NO       | `'active'`          | CHECK IN (`active`, `completed`, `paused`, `abandoned`) |
| `progress_pct` | int         | NO       | `0`                 | CHECK BETWEEN 0 AND 100                                 |
| `weight`       | int         | NO       | `1`                 | CHECK > 0; used in weighted progress average            |
| `created_at`   | timestamptz | NO       | `now()`             |                                                         |
| `updated_at`   | timestamptz | NO       | `now()`             | Auto-updated by `set_updated_at` trigger                |

**Ownership invariant:** `monthly_goals.user_id` must match `goals.user_id` for the parent goal. Enforced by `validate_monthly_goal_owner_trigger` before insert or update.

---

### `weekly_tasks`

Core accountability unit. `week_start` must always be a Monday: `EXTRACT(ISODOW ...) = 1`.

| Column            | Type        | Nullable | Default             | Mutability                                                                                                     |
| ----------------- | ----------- | -------- | ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `id`              | uuid        | NO       | `gen_random_uuid()` | **Always immutable**                                                                                           |
| `user_id`         | uuid        | NO       | —                   | **Always immutable**                                                                                           |
| `created_at`      | timestamptz | NO       | `now()`             | **Always immutable**                                                                                           |
| `goal_id`         | uuid        | YES      | NULL                | FK → `goals(id)` **ON DELETE RESTRICT**; auto-set from `monthly_goal_id` if provided; locked after week closes |
| `monthly_goal_id` | uuid        | YES      | NULL                | FK → `monthly_goals(id)` **ON DELETE RESTRICT**; primary hierarchy link; locked after week closes              |
| `group_id`        | uuid        | YES      | NULL                | FK → `groups(id)` **ON DELETE RESTRICT**; locked after week closes                                             |
| `week_start`      | date        | NO       | —                   | CHECK ISODOW = 1; locked after week closes                                                                     |
| `title`           | text        | NO       | —                   | Locked after week closes                                                                                       |
| `description`     | text        | YES      | NULL                | Locked after week closes                                                                                       |
| `category`        | text        | YES      | NULL                | Same enum as goals; locked after week closes                                                                   |
| `priority`        | text        | NO       | `'medium'`          | CHECK IN (`high`, `medium`, `low`); locked after week closes                                                   |
| `target_value`    | numeric     | YES      | NULL                | CHECK > 0 if set; locked after week closes                                                                     |
| `target_unit`     | text        | YES      | NULL                | Locked after week closes                                                                                       |
| `due_date`        | date        | YES      | NULL                | Locked after week closes                                                                                       |
| `status`          | text        | NO       | `'pending'`         | CHECK IN (`pending`, `in_progress`, `completed`, `missed`); mutable post-lock                                  |
| `progress`        | numeric     | NO       | `0`                 | CHECK >= 0; mutable post-lock                                                                                  |
| `reflection`      | text        | YES      | NULL                | Mutable post-lock                                                                                              |
| `updated_at`      | timestamptz | NO       | `now()`             | Auto-updated; mutable post-lock                                                                                |

**Hierarchy trigger:** `validate_weekly_task_hierarchy_trigger` fires before insert or update. When `monthly_goal_id` is set, it verifies ownership and auto-sets `goal_id = monthly_goals.goal_id`.

---

### `ratings`

One rating per rater, ratee, group, and week.

| Column              | Type        | Nullable | Default             | Mutability                                 |
| ------------------- | ----------- | -------- | ------------------- | ------------------------------------------ |
| `id`                | uuid        | NO       | `gen_random_uuid()` | **Immutable**                              |
| `week_start`        | date        | NO       | —                   | CHECK ISODOW = 1; **immutable**            |
| `rater_id`          | uuid        | NO       | —                   | FK → `profiles(id)` CASCADE; **immutable** |
| `ratee_id`          | uuid        | NO       | —                   | FK → `profiles(id)` CASCADE; **immutable** |
| `group_id`          | uuid        | NO       | —                   | FK → `groups(id)` CASCADE; **immutable**   |
| `discipline_score`  | int         | NO       | —                   | CHECK 1–10; mutable                        |
| `effort_score`      | int         | NO       | —                   | CHECK 1–10; mutable                        |
| `consistency_score` | int         | NO       | —                   | CHECK 1–10; mutable                        |
| `note`              | text        | YES      | NULL                | Mutable                                    |
| `created_at`        | timestamptz | NO       | `now()`             | **Immutable**                              |

**Constraints:** `CHECK (rater_id <> ratee_id)`, `UNIQUE(week_start, rater_id, ratee_id, group_id)`

---

## Functions

### `generate_invite_code() → text`

Generates an 8-character uppercase invite code via `pgcrypto.gen_random_bytes()`.

Character set: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
No O/0/I/1 characters. Zero modulo bias.

**Not client-callable.** Revoked from PUBLIC. Only called inside `create_group_with_owner` as `SECURITY DEFINER`.

### `get_week_lock_time(w date) → timestamptz`

Returns `W 23:59:59 UTC`.

Casts `date → timestamp` at midnight without timezone, then applies `AT TIME ZONE 'UTC'`.

This prevents Postgres session timezone drift.

Revoked from PUBLIC and granted to `authenticated`. Used in the `is_week_locked` RLS check.

### `is_week_locked(w date) → boolean`

Returns whether a task week is locked.

In the current development configuration, this function returns `false` so weekly task locking is disabled while the feature is being tested.

To re-enable locking, replace the function body with:

```sql
SELECT now() > public.get_week_lock_time(w);
```

Revoked from PUBLIC and granted to `authenticated`. Used in the `weekly_tasks` RLS insert policy.

### `validate_monthly_goal_owner() → trigger`

Ensures `monthly_goals.user_id` matches the parent `goals.user_id`.

Fires before insert or update on `monthly_goals`. Raises `ownership_mismatch` if `user_id` does not match the parent goal.

### `validate_weekly_task_hierarchy() → trigger`

Fires before insert or update on `weekly_tasks`.

When `monthly_goal_id` is set, it verifies that the monthly goal exists and belongs to the same user. It also auto-sets `goal_id = monthly_goals.goal_id` so the hierarchy remains consistent.

### `is_group_member(p_group_id uuid, p_user_id uuid) → boolean`

`SECURITY DEFINER`.

Returns `true` if `p_user_id` is a member of `p_group_id`.

Revoked from PUBLIC and granted to `authenticated`.

Used in RLS policies. Bypasses RLS internally to avoid infinite recursion on `group_members`.

### `is_group_owner(p_group_id uuid, p_user_id uuid) → boolean`

`SECURITY DEFINER`.

Returns `true` if `p_user_id` has `role = 'owner'` in `p_group_id`.

Revoked from PUBLIC and granted to `authenticated`.

### `create_group_with_owner(p_name text, p_description text) → jsonb`

`SECURITY DEFINER`.

Validates `p_name`, trims it, then atomically creates a group and owner membership row.

Returns:

```json
{
  "group_id": "<uuid>",
  "invite_code": "<code>"
}
```

Raises an exception if `auth.uid()` is null or the group name is empty.

Revoked from PUBLIC and granted to `authenticated`.

### `join_group_by_invite(p_invite_code text) → uuid`

`SECURITY DEFINER`.

Finds a group by `upper(trim(invite_code))`, then inserts the caller as a member.

Idempotent via `ON CONFLICT DO NOTHING`.

Returns `group_id`.

Raises an exception if the user is not authenticated or the invite code is invalid.

Revoked from PUBLIC and granted to `authenticated`.

---

## Triggers

| Trigger                                  | Table           | Event            | Timing | Function                           | Purpose                                                                                |
| ---------------------------------------- | --------------- | ---------------- | ------ | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `on_auth_user_created`                   | `auth.users`    | INSERT           | AFTER  | `handle_new_user()`                | Creates profile row on signup                                                          |
| `set_profiles_updated_at`                | `profiles`      | UPDATE           | BEFORE | `set_updated_at()`                 | Keeps `updated_at` current                                                             |
| `protect_group_immutable_fields`         | `groups`        | UPDATE           | BEFORE | `protect_group_fields()`           | Blocks changes to `id`, `created_by`, `invite_code`, `created_at`                      |
| `set_groups_updated_at`                  | `groups`        | UPDATE           | BEFORE | `set_updated_at()`                 | Keeps `updated_at` current                                                             |
| `set_goals_updated_at`                   | `goals`         | UPDATE           | BEFORE | `set_updated_at()`                 | Keeps `updated_at` current                                                             |
| `protect_group_last_owner`               | `group_members` | UPDATE OR DELETE | BEFORE | `protect_last_owner()`             | Prevents ownerless groups                                                              |
| `protect_group_member_immutable_fields`  | `group_members` | UPDATE           | BEFORE | `protect_group_member_fields()`    | Blocks changes to `id`, `group_id`, `user_id`, `joined_at`                             |
| `validate_monthly_goal_owner_trigger`    | `monthly_goals` | INSERT OR UPDATE | BEFORE | `validate_monthly_goal_owner()`    | Ensures `user_id` matches parent goal's `user_id`                                      |
| `set_monthly_goals_updated_at`           | `monthly_goals` | UPDATE           | BEFORE | `set_updated_at()`                 | Keeps `updated_at` current                                                             |
| `enforce_weekly_task_lock`               | `weekly_tasks`  | UPDATE OR DELETE | BEFORE | `enforce_task_lock()`              | Enforces immutable fields, post-lock structural freeze, and post-lock delete block     |
| `validate_weekly_task_hierarchy_trigger` | `weekly_tasks`  | INSERT OR UPDATE | BEFORE | `validate_weekly_task_hierarchy()` | Verifies monthly goal ownership and auto-sets `goal_id` from `monthly_goals.goal_id`   |
| `set_weekly_tasks_updated_at`            | `weekly_tasks`  | UPDATE           | BEFORE | `set_updated_at()`                 | Keeps `updated_at` current                                                             |
| `protect_rating_immutable_fields`        | `ratings`       | UPDATE           | BEFORE | `protect_rating_fields()`          | Blocks changes to `id`, `week_start`, `rater_id`, `ratee_id`, `group_id`, `created_at` |

### Trigger firing order

Postgres fires triggers alphabetically by trigger name for the same table, timing, and event.

`groups` before update:

1. `protect_group_immutable_fields` — immutability check
2. `set_groups_updated_at` — sets `updated_at = now()`

`group_members` before update:

1. `protect_group_last_owner` — last-owner check
2. `protect_group_member_immutable_fields` — immutability check

`monthly_goals` before insert or update:

1. `validate_monthly_goal_owner_trigger` — ownership check

`weekly_tasks` before insert:

1. `validate_weekly_task_hierarchy_trigger` — hierarchy validation and `goal_id` auto-set

`weekly_tasks` before update:

1. `enforce_weekly_task_lock` — always-immutable fields and lock check
2. `set_weekly_tasks_updated_at` — sets `updated_at = now()`
3. `validate_weekly_task_hierarchy_trigger` — hierarchy validation after lock enforcement

### `protect_last_owner` edge case: cascade from group deletion

When a group row is deleted, Postgres cascades to `group_members`.

By the time the before-delete trigger fires on `group_members`, the group row is already gone. The trigger checks:

```sql
EXISTS (SELECT 1 FROM groups WHERE id = OLD.group_id)
```

This returns false, so the trigger allows the cascade without raising an exception.

---

## RLS Policies

### `profiles`

| Policy                          | Operation | Rule                   |
| ------------------------------- | --------- | ---------------------- |
| `profiles_select_authenticated` | SELECT    | Any authenticated user |
| `profiles_update_own`           | UPDATE    | `auth.uid() = id`      |

### `groups`

| Policy                 | Operation | Rule                                                                                                      |
| ---------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `groups_select_member` | SELECT    | `is_group_member(id, auth.uid())`                                                                         |
| None                   | INSERT    | Use `create_group_with_owner()`                                                                           |
| `groups_update_owner`  | UPDATE    | `is_group_owner(id, auth.uid())` on both USING and WITH CHECK; trigger enforces column-level immutability |
| `groups_delete_owner`  | DELETE    | `is_group_owner(id, auth.uid())`                                                                          |

### `group_members`

| Policy                               | Operation | Rule                                                                                        |
| ------------------------------------ | --------- | ------------------------------------------------------------------------------------------- |
| `group_members_select_member`        | SELECT    | `is_group_member(group_id, auth.uid())`                                                     |
| None                                 | INSERT    | Use `create_group_with_owner()` or `join_group_by_invite()`                                 |
| `group_members_update_owner`         | UPDATE    | `is_group_owner(group_id, auth.uid())`; trigger enforces last-owner and column immutability |
| `group_members_delete_self_or_owner` | DELETE    | `user_id = auth.uid() OR is_group_owner(group_id, auth.uid())`; trigger enforces last-owner |

### `goals`

| Policy             | Operation | Rule                   |
| ------------------ | --------- | ---------------------- |
| `goals_select_own` | SELECT    | `user_id = auth.uid()` |
| `goals_insert_own` | INSERT    | `user_id = auth.uid()` |
| `goals_update_own` | UPDATE    | `user_id = auth.uid()` |
| `goals_delete_own` | DELETE    | `user_id = auth.uid()` |

### `monthly_goals`

| Policy                     | Operation | Rule                   |
| -------------------------- | --------- | ---------------------- |
| `monthly_goals_select_own` | SELECT    | `user_id = auth.uid()` |
| `monthly_goals_insert_own` | INSERT    | `user_id = auth.uid()` |
| `monthly_goals_update_own` | UPDATE    | `user_id = auth.uid()` |
| `monthly_goals_delete_own` | DELETE    | `user_id = auth.uid()` |

### `weekly_tasks`

| Policy                    | Operation | Rule                                                                                                                                          |
| ------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `weekly_tasks_select`     | SELECT    | Own tasks or group member for group-linked tasks                                                                                              |
| `weekly_tasks_insert`     | INSERT    | Own task, week not locked, goal owned by caller, and group membership valid                                                                   |
| `weekly_tasks_update_own` | UPDATE    | USING: `user_id = auth.uid()`; WITH CHECK: own task, goal ownership, and group membership; trigger enforces immutability and post-lock freeze |
| `weekly_tasks_delete_own` | DELETE    | `user_id = auth.uid()`; trigger blocks post-lock delete                                                                                       |

### `ratings`

| Policy                        | Operation | Rule                                                                                                                                                 |
| ----------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ratings_select_group_member` | SELECT    | `is_group_member(group_id, auth.uid())`                                                                                                              |
| `ratings_insert`              | INSERT    | `rater_id = auth.uid()` and both rater and ratee are group members                                                                                   |
| `ratings_update_rater`        | UPDATE    | USING: `rater_id = auth.uid()`; WITH CHECK: rater is a group member and ratee is still a group member; trigger enforces immutable identifying fields |
| `ratings_delete_rater`        | DELETE    | `rater_id = auth.uid()`                                                                                                                              |

---

## Indexes

| Index                              | Table           | Columns                  |
| ---------------------------------- | --------------- | ------------------------ |
| Unique constraint                  | `groups`        | `invite_code`            |
| `idx_groups_created_by`            | `groups`        | `created_by`             |
| Unique constraint                  | `group_members` | `(group_id, user_id)`    |
| `idx_group_members_group_id`       | `group_members` | `group_id`               |
| `idx_group_members_user_id`        | `group_members` | `user_id`                |
| `idx_goals_user_id`                | `goals`         | `user_id`                |
| `idx_monthly_goals_user_id`        | `monthly_goals` | `user_id`                |
| `idx_monthly_goals_goal_id`        | `monthly_goals` | `goal_id`                |
| `idx_monthly_goals_user_month`     | `monthly_goals` | `(user_id, month_start)` |
| `idx_weekly_tasks_user_week`       | `weekly_tasks`  | `(user_id, week_start)`  |
| `idx_weekly_tasks_group_week`      | `weekly_tasks`  | `(group_id, week_start)` |
| `idx_weekly_tasks_goal_id`         | `weekly_tasks`  | `goal_id`                |
| `idx_weekly_tasks_monthly_goal_id` | `weekly_tasks`  | `monthly_goal_id`        |
| `idx_ratings_group_week`           | `ratings`       | `(group_id, week_start)` |
| `idx_ratings_rater_id`             | `ratings`       | `rater_id`               |
| `idx_ratings_ratee_id`             | `ratings`       | `ratee_id`               |

---

## Edit-Lock Architecture

```text
Task week_start = W
Lock time = Monday W at 23:59:59 UTC

Timeline:
Mon 00:00 ──── editable window ──── Mon 23:59:59 UTC ──── LOCKED ────▶
                                             ↑
                                   get_week_lock_time(W)
```

Enforcement layers:

1. Database trigger — `enforce_task_lock()` handles immutable fields, post-lock freeze, and protected deletes.
2. RLS insert policy — `NOT is_week_locked(week_start)` in `WITH CHECK`.
3. Server action — calls `is_week_locked()` before mutations.
4. UI — disables form fields for user experience only; not treated as a security layer.

| Field          | Immutable always | Locked post-week-close | Mutable post-lock |
| -------------- | ---------------- | ---------------------- | ----------------- |
| `id`           | ✅                | —                      | —                 |
| `user_id`      | ✅                | —                      | —                 |
| `created_at`   | ✅                | —                      | —                 |
| `week_start`   | —                | ✅                      | —                 |
| `title`        | —                | ✅                      | —                 |
| `description`  | —                | ✅                      | —                 |
| `category`     | —                | ✅                      | —                 |
| `goal_id`      | —                | ✅                      | —                 |
| `group_id`     | —                | ✅                      | —                 |
| `priority`     | —                | ✅                      | —                 |
| `target_value` | —                | ✅                      | —                 |
| `target_unit`  | —                | ✅                      | —                 |
| `due_date`     | —                | ✅                      | —                 |
| `status`       | —                | —                      | ✅                 |
| `progress`     | —                | —                      | ✅                 |
| `reflection`   | —                | —                      | ✅                 |
| `updated_at`   | —                | —                      | ✅, auto-set       |

---

## Function permissions summary

| Function                  | PUBLIC  | `anon` | `authenticated` | Notes                                                          |
| ------------------------- | ------- | ------ | --------------- | -------------------------------------------------------------- |
| `generate_invite_code`    | REVOKED | —      | —               | Only called by `create_group_with_owner` as `SECURITY DEFINER` |
| `get_week_lock_time`      | REVOKED | —      | GRANTED         | Used in `is_week_locked` RLS check                             |
| `is_week_locked`          | REVOKED | —      | GRANTED         | Used in `weekly_tasks` insert RLS policy                       |
| `is_group_member`         | REVOKED | —      | GRANTED         | Used in RLS policies                                           |
| `is_group_owner`          | REVOKED | —      | GRANTED         | Used in RLS policies                                           |
| `create_group_with_owner` | REVOKED | —      | GRANTED         | Client-callable RPC                                            |
| `join_group_by_invite`    | REVOKED | —      | GRANTED         | Client-callable RPC                                            |
| Trigger functions         | —       | —      | —               | Return type `trigger`; not exposed through PostgREST           |

---

## Account-deletion behavior

| Table           | Column                  | FK behavior  | Effect when profile is deleted                                                                            |
| --------------- | ----------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `group_members` | `user_id`               | CASCADE      | Row deleted; `protect_last_owner` trigger fires and blocks if this would leave the group without an owner |
| `goals`         | `user_id`               | CASCADE      | User's goals are deleted                                                                                  |
| `weekly_tasks`  | `user_id`               | CASCADE      | User's tasks are deleted                                                                                  |
| `ratings`       | `rater_id` / `ratee_id` | CASCADE      | Ratings involving the user are deleted                                                                    |
| `groups`        | `created_by`            | **RESTRICT** | Profile deletion is blocked if the user created any groups                                                |
| `weekly_tasks`  | `group_id`              | **RESTRICT** | Group deletion is blocked while tasks reference it                                                        |
| `weekly_tasks`  | `goal_id`               | **RESTRICT** | Goal deletion is blocked while tasks reference it                                                         |
