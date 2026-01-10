# MoLOS-Tasks: Task Management Module

[![MoLOS Module](https://img.shields.io/badge/MoLOS-Module-blue.svg)](https://github.com/MoLOS-App/MoLOS)

A comprehensive task management module for the MoLOS (Modular Life Organization System) ecosystem. This module provides Eisenhower Matrix-based task prioritization, project organization, area management, and daily logging capabilities.

# ✔️ Overview

MoLOS-Tasks is a modular component that integrates seamlessly into the main MoLOS application, providing robust task management functionality while maintaining the core philosophy of modularity and privacy-first design.

## ✔️ Core Features

- **Eisenhower Matrix**: Prioritize tasks based on urgency and importance
- **Project Management**: Organize tasks into projects with flexible hierarchies
- **Area Organization**: Group related projects and tasks into logical areas
- **Daily Logging**: Track daily progress and maintain productivity journals
- **Smart Filtering**: Advanced filtering and search capabilities
- **Real-time Updates**: Live synchronization across the application

# ✔️ Relationship to MoLOS

## Architecture Integration

MoLOS-Tasks operates as a **plug-and-play module** within the MoLOS ecosystem:

# ✔️ Getting Started

## Prerequisites

- MoLOS core application installed and running
- Node.js 20+
- SQLite database

## UI installation

Just go to:
 - Settings
 - Module Management
 - Install Tab
 - Paste https://github.com/MoLOS-App/MoLOS-Tasks.git
 - Install

## Manual installation

1. **Place the Module**:

   ```bash
   # Copy MoLOS-Tasks folder to the external_modules directory
   cp -r MoLOS-Tasks MoLOS/external_modules/
   ```

2. **Sync Modules**:

   ```bash
   cd MoLOS
   npm run module:sync
   ```

3. **Access the Module**:
   - Navigate to `/MoLOS-Tasks` in your MoLOS application
   - The module will be automatically integrated into the main navigation

## Development Setup

I will do a full module development guide in the future. It will be at [the docs](https://molos-docs.eduard3v.com)

# ✔️ Architecture

## Database Schema

All tables are prefixed with `MoLOS-Tasks_` to maintain namespace isolation:

```sql
CREATE TABLE `MoLOS-Tasks_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'to_do' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`due_date` integer,
	`do_date` integer,
	`effort` integer,
	`context` text,
	`is_completed` integer DEFAULT false NOT NULL,
	`project_id` text,
	`area_id` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MoLOS-Tasks_areas` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`theme_color` text,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MoLOS-Tasks_daily_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`log_date` integer NOT NULL,
	`mood` text,
	`sleep_hours` real,
	`morning_routine` integer DEFAULT false,
	`evening_routine` integer DEFAULT false,
	`notes` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
```

## Repository Pattern

```typescript
export class AreaRepository extends BaseRepository {
  async getByUserId(userId: string): Promise<Area[]> {
    const result = await this.db
      .select()
      .from(tasksAreas)
      .where(eq(tasksAreas.userId, userId));

    return result as Area[];
  }

  async getById(id: string, userId: string): Promise<Area | null> {
    const result = await this.db
      .select()
      .from(tasksAreas)
      .where(and(eq(tasksAreas.id, id), eq(tasksAreas.userId, userId)))
      .limit(1);

    return result[0] ? (result[0] as Area) : null;
  }

  async create(
    area: Omit<Area, "id" | "createdAt" | "updatedAt">,
  ): Promise<Area> {
    const result = await this.db.insert(tasksAreas).values(area).returning();

    return result[0] as Area;
  }

  async update(
    id: string,
    userId: string,
    updates: Partial<Omit<Area, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<Area | null> {
    const result = await this.db
      .update(tasksAreas)
      .set({ ...updates, updatedAt: Math.floor(Date.now() / 1000) })
      .where(and(eq(tasksAreas.id, id), eq(tasksAreas.userId, userId)))
      .returning();

    return result[0] ? (result[0] as Area) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(tasksAreas)
      .where(and(eq(tasksAreas.id, id), eq(tasksAreas.userId, userId)));

    return result.changes > 0;
  }
}
```

## Naming Conventions

- **Database**: All tables/enums prefixed with `MoLOS-Tasks_`
- **Components**: PascalCase for component names
- **Stores**: camelCase with descriptive names
- **API Routes**: RESTful patterns (`/api/MoLOS-Tasks/[id]`)

## Import Path Standards

Use absolute imports within the module. The MoLOS core will automatically standardize paths during integration:

```typescript
// Correct: Absolute imports
import { TaskStore } from "$lib/stores/task.store";

// Avoid: Relative imports
import { TaskStore } from "../stores/task.store";
import { TaskRepository } from "../repositories/task-repository";
```

## Database Migrations

Always create migrations for schema changes:

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate
```

## State Management

Use Svelte stores:

```typescript
import { writable, derived } from "svelte/store";

...

// UI State Store
export const tasksUIState = writable({
  loading: false,
  error: null as string | null,
  lastLoaded: null as number | null,
});

// Derived Stats
export const taskStats = derived(tasksStore, ($tasks) => {
  const total = $tasks.length;
  const completed = $tasks.filter((t) => t.isCompleted).length;
  const active = total - completed;
  const now = Math.floor(Date.now() / 1000);
  const scheduled = $tasks.filter((t) => t.dueDate && t.dueDate > now).length;

  return { total, completed, active, scheduled };
});

/**
 * Actions
 */

export async function addTaskStore(data: CreateTaskInput) {
  try {
    const newTask = await api.createTask(data);
    tasksStore.update((tasks) => [newTask, ...tasks]);
    return newTask;
  } catch (err) {
    console.error("Failed to add task:", err);
    throw err;
  }
}

...

export async function deleteTaskStore(id: string) {
  try {
    await api.deleteTask(id);
    tasksStore.update((tasks) => tasks.filter((t) => t.id !== id));
  } catch (err) {
    console.error("Failed to delete task:", err);
    throw err;
  }
}
```

# 🛡️ Best Practices

## Avoiding Breaking Changes

1. **API Stability**: Maintain backward compatibility in API responses
2. **Database Schema**: Use additive changes; avoid dropping columns
3. **Component Props**: Keep component interfaces stable
4. **Store Contracts**: Don't change store method signatures unexpectedly
5. **LEAVE ALWAYS THE ACTIONS TO THE API**: This means also at the front, use the API as a centralised entrypoint for data manipulation. Do not use repositories in the +page.server.ts or similar

## Error Handling

```typescript
// Good: Comprehensive error handling
export async function createTask(data: TaskData): Promise<Task> {
  try {
    const validated = taskSchema.parse(data);
    const task = await this.repository.create(validated);
    return task;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError("Invalid task data", error.errors);
    }
    throw new DatabaseError("Failed to create task", error);
  }
}
```

## Testing

Documentation pending, but testing is also recommended

## Performance Considerations

1. **Lazy Loading**: Load data on-demand
2. **Pagination**: Implement for large datasets
3. **Memoization**: Cache expensive computations

# 🔄 Integration Examples

## Using Task Components

```svelte
<script>
  import { TaskItem } from '$lib/components/task-item';
  import { tasksStore } from '$lib/stores/tasks.store';
</script>

{#each $tasksStore as task}
  <TaskItem {task} oncomplete={handleComplete} />
{/each}
```

## API Integration

```typescript
import { TasksSettingsRepository } from "$lib/repositories/external_modules/MoLOS-Tasks/settings-repository";
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new TasksSettingsRepository();
  const settings = await repo.getByUserId(userId);
  return json(settings);
};

export const PUT: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const data = await request.json();
  const repo = new TasksSettingsRepository();
  const updated = await repo.update(userId, data);

  if (!updated) throw error(404, "Not found");
  return json(updated);
};
```

## Cross-Module Communication

```typescript
// Integration with other MoLOS modules
import { notesApi } from "$lib/modules/notes/api";

export class TaskService {
  async linkToNote(taskId: number, noteId: number) {
    // Link task to knowledge module note
    await notesApi.linkEntity(noteId, "task", taskId);
  }
}
```

# 🐛 Troubleshooting

## Common Issues

1. **Module Not Loading**:
   - Ensure `manifest.yaml` is valid
   - Check that `npm run module:sync` completed successfully
   - Verify database migrations ran

2. **Import Errors**:
   - Use `$lib` aliases (handled by core)

3. **Database Conflicts**:
   - Ensure table prefixes are unique and do not collide with other modules
   - Have the right prefix

## Debug Commands

Run all these commands inside the core MoLOS app

```bash
# Check module status
npm run module:sync

# View database schema
npx drizzle-kit studio

# Run tests
npm test
```

# 🤝 Contributing

1. Follow the [MoLOS Development Guide](https://docs.molos.com)
2. Maintain test coverage above 80%
3. Update documentation for API changes
4. Use conventional commits

# 📄 License

Licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

**MoLOS-Tasks** is part of the MoLOS ecosystem. For more information about MoLOS, visit [MoLOS Web](https://docs.molos.com).
