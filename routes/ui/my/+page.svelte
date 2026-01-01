<script lang="ts">
	import { page } from '$app/stores';
	const userId = $page.data.userId;
	import {
		tasksStore,
		projectsStore,
		areasStore,
		addTaskStore,
		updateTaskStore,
		deleteTaskStore,
		tasksUIState,
		tasksSettingsStore
	} from '$lib/modules/MoLOS-Tasks/stores';
	import TaskItem from '$lib/modules/MoLOS-Tasks/components/task-item.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import {
		AlertDialog,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogCancel,
		AlertDialogAction
	} from '$lib/components/ui/alert-dialog';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import { Plus, Filter, Search, X, LayoutGrid, List, ChevronDown, ChevronUp } from 'lucide-svelte';

	// State
	let isDragging = $state(false);
	let open = $state(false);
	let editingTaskId = $state<string | null>(null);
	let showDeleteDialog = $state(false);
	let taskToDeleteId = $state<string | null>(null);
	let showCompleted = $state($tasksSettingsStore?.showCompleted ?? false);
	let filterOpen = $state(false);
	let search = $state('');
	let viewMode = $state<'kanban' | 'list'>('kanban');
	let compactMode = $derived($tasksSettingsStore?.compactMode ?? false);

	// Form State
	let formTitle = $state('');
	let formDescription = $state('');
	let formStatus = $state<'to_do' | 'in_progress' | 'waiting' | 'done' | 'archived'>('to_do');
	let formPriority = $state<'high' | 'medium' | 'low'>('medium');
	let formDueDateStr = $state('');
	let formProjectId = $state<string>('');
	let formAreaId = $state<string>('');

	let filters = $state({
		status: '',
		priority: '',
		projectId: '',
		areaId: '',
		dueDateFrom: '',
		dueDateTo: ''
	});

	// Logic
	$effect(() => {
		if ($tasksSettingsStore) {
			showCompleted = $tasksSettingsStore.showCompleted;
		}
	});

	const resetForm = () => {
		formTitle = '';
		formDescription = '';
		formStatus = 'to_do';
		formPriority = 'medium';
		formDueDateStr = '';
		formProjectId = '';
		formAreaId = '';
	};

	const openAdd = () => {
		resetForm();
		editingTaskId = null;
		open = true;
	};

	const openEdit = (task: any) => {
		formTitle = task.title;
		formDescription = task.description || '';
		formStatus = task.status || 'to_do';
		formPriority = task.priority || 'medium';
		formDueDateStr = task.dueDate ? new Date(task.dueDate * 1000).toISOString().split('T')[0] : '';
		formProjectId = task.projectId || '';
		formAreaId = task.areaId || '';
		editingTaskId = task.id;
		open = true;
	};

	const handleSave = async () => {
		if (!formTitle.trim()) {
			toast.error('Title is required');
			return;
		}

		const dueDate = formDueDateStr ? Math.floor(new Date(formDueDateStr).getTime() / 1000) : null;
		const data = {
			title: formTitle.trim(),
			description: formDescription.trim() || undefined,
			status: formStatus,
			priority: formPriority,
			dueDate: dueDate || undefined,
			projectId: formProjectId || undefined,
			areaId: formAreaId || undefined,
			userId: userId,
			isCompleted: false // Default value for new tasks
		};

		try {
			if (editingTaskId) {
				await updateTaskStore(editingTaskId, { ...data, dueDate: dueDate || undefined });
				toast.success('Task updated');
			} else {
				await addTaskStore(data);
				toast.success('Task created');
			}
			open = false;
			resetForm();
		} catch (err) {
			toast.error('Failed to save task');
		}
	};

	const handleToggle = async (task: any) => {
		const newStatus = task.status === 'done' ? 'to_do' : 'done';
		try {
			await updateTaskStore(task.id, { status: newStatus });
		} catch (err) {
			toast.error('Failed to update task');
		}
	};

	const requestDelete = (taskId: string) => {
		taskToDeleteId = taskId;
		showDeleteDialog = true;
	};

	const confirmDelete = async () => {
		if (!taskToDeleteId) return;
		try {
			await deleteTaskStore(taskToDeleteId);
			toast.success('Task deleted');
		} catch (err) {
			toast.error('Failed to delete task');
		} finally {
			taskToDeleteId = null;
			showDeleteDialog = false;
		}
	};

	const handleUpdateStatus = async (taskId: string, newStatus: any) => {
		try {
			await updateTaskStore(taskId, { status: newStatus });
		} catch (err) {
			toast.error('Failed to update status');
		}
	};

	// Drag & Drop
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent, status: any) {
		e.preventDefault();
		const target = e.currentTarget as HTMLElement;
		target.classList.remove('bg-primary/5', 'border-primary', 'border-dashed');
		const taskId = e.dataTransfer!.getData('text/plain');
		if (taskId) {
			handleUpdateStatus(taskId, status);
		}
	}

	// Filtering
	const matchesFilters = (task: any) => {
		if (filters.status && task.status !== filters.status) return false;
		if (filters.priority && task.priority !== filters.priority) return false;
		if (filters.projectId && task.projectId !== filters.projectId) return false;
		if (filters.areaId && task.areaId !== filters.areaId) return false;
		if (
			filters.dueDateFrom &&
			(!task.dueDate || task.dueDate < Math.floor(new Date(filters.dueDateFrom).getTime() / 1000))
		)
			return false;
		if (
			filters.dueDateTo &&
			(!task.dueDate || task.dueDate > Math.floor(new Date(filters.dueDateTo).getTime() / 1000))
		)
			return false;
		if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
		return true;
	};

	const filteredTasks = $derived(
		$tasksStore.filter((t) => (showCompleted || t.status !== 'done') && matchesFilters(t))
	);

	const columns = $derived([
		{ id: 'to_do', title: 'To Do', color: 'bg-muted' },
		{ id: 'in_progress', title: 'In Progress', color: 'bg-primary' },
		{ id: 'waiting', title: 'Waiting', color: 'bg-accent' },
		...(showCompleted
			? [
					{ id: 'done', title: 'Done', color: 'bg-primary' },
					{ id: 'archived', title: 'Archived', color: 'bg-muted' }
				]
			: [])
	]);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">My Task Board</h1>
			<p class="text-muted-foreground">Manage and organize your personal tasks.</p>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex rounded-lg border bg-muted/50 p-1">
				<Button
					variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
					size="sm"
					class="h-8 px-3"
					onclick={() => (viewMode = 'kanban')}
				>
					<LayoutGrid class="mr-2 h-4 w-4" />
					Board
				</Button>
				<Button
					variant={viewMode === 'list' ? 'secondary' : 'ghost'}
					size="sm"
					class="h-8 px-3"
					onclick={() => (viewMode = 'list')}
				>
					<List class="mr-2 h-4 w-4" />
					List
				</Button>
			</div>
			<Button onclick={openAdd} class="rounded-full shadow-lg">
				<Plus class="mr-2 h-5 w-5" />
				New Task
			</Button>
		</div>
	</div>

	<!-- Toolbar -->
	<Card class="border-none bg-accent/30 shadow-sm">
		<CardContent class="p-3">
			<div class="flex flex-wrap items-center gap-3">
				<div class="relative min-w-50 flex-1">
					<Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
					<Input
						placeholder="Search tasks..."
						bind:value={search}
						class="border-none bg-background pl-9 shadow-sm"
					/>
				</div>

				<Button
					variant={filterOpen ? 'secondary' : 'outline'}
					size="sm"
					onclick={() => (filterOpen = !filterOpen)}
					class="shadow-sm"
				>
					<Filter class="mr-2 h-4 w-4" />
					Filters
					{#if Object.values(filters).some((v) => v !== '')}
						<Badge variant="default" class="ml-2 h-5 min-w-[20px] px-1.5"
							>{Object.values(filters).filter((v) => v !== '').length}</Badge
						>
					{/if}
				</Button>

				<Button
					variant={showCompleted ? 'secondary' : 'outline'}
					size="sm"
					onclick={() => (showCompleted = !showCompleted)}
					class="shadow-sm"
				>
					{showCompleted ? 'Hide Completed' : 'Show Completed'}
				</Button>

				{#if search || Object.values(filters).some((v) => v !== '')}
					<Button
						variant="ghost"
						size="sm"
						onclick={() => {
							search = '';
							filters = {
								status: '',
								priority: '',
								projectId: '',
								areaId: '',
								dueDateFrom: '',
								dueDateTo: ''
							};
						}}
					>
						<X class="mr-2 h-4 w-4" />
						Clear
					</Button>
				{/if}
			</div>

			{#if filterOpen}
				<div
					class="mt-4 grid animate-in grid-cols-1 gap-4 fade-in slide-in-from-top-2 md:grid-cols-3 lg:grid-cols-5"
				>
					<div class="space-y-1.5">
						<Label class="text-muted-foreground text-xs font-bold tracking-wider uppercase"
							>Priority</Label
						>
						<select
							bind:value={filters.priority}
							class="h-9 w-full rounded-md border bg-background px-3 text-sm"
						>
							<option value="">All Priorities</option>
							<option value="high">High</option>
							<option value="medium">Medium</option>
							<option value="low">Low</option>
						</select>
					</div>
					<div class="space-y-1.5">
						<Label class="text-muted-foreground text-xs font-bold tracking-wider uppercase"
							>Project</Label
						>
						<select
							bind:value={filters.projectId}
							class="h-9 w-full rounded-md border bg-background px-3 text-sm"
						>
							<option value="">All Projects</option>
							{#each $projectsStore as p}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1.5">
						<Label class="text-muted-foreground text-xs font-bold tracking-wider uppercase"
							>Area</Label
						>
						<select
							bind:value={filters.areaId}
							class="h-9 w-full rounded-md border bg-background px-3 text-sm"
						>
							<option value="">All Areas</option>
							{#each $areasStore as a}
								<option value={a.id}>{a.name}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1.5">
						<Label class="text-muted-foreground text-xs font-bold tracking-wider uppercase"
							>Due From</Label
						>
						<Input type="date" bind:value={filters.dueDateFrom} class="h-9" />
					</div>
					<div class="space-y-1.5">
						<Label class="text-muted-foreground text-xs font-bold tracking-wider uppercase"
							>Due To</Label
						>
						<Input type="date" bind:value={filters.dueDateTo} class="h-9" />
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Content -->
	{#if viewMode === 'kanban'}
		<div
			class="grid grid-cols-1 gap-6 overflow-x-auto pb-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
		>
			{#each columns as col}
				<div class="flex min-w-[300px] flex-col gap-4">
					<div class="flex items-center justify-between px-2">
						<div class="flex items-center gap-2">
							<div class="h-2.5 w-2.5 rounded-full {col.color}"></div>
							<h3 class="text-muted-foreground text-sm font-bold tracking-widest uppercase">
								{col.title}
							</h3>
						</div>
						<Badge variant="secondary" class="h-5 rounded-full px-2 py-0 text-[10px] font-bold">
							{filteredTasks.filter((t) => t.status === col.id).length}
						</Badge>
					</div>

					<div
						class="min-h-[500px] flex-1 rounded-xl border-2 border-transparent bg-muted/20 p-2 transition-colors"
						role="list"
						aria-label="{col.title} tasks"
						ondragover={handleDragOver}
						ondrop={(e) => handleDrop(e, col.id)}
						ondragenter={(e) =>
							(e.currentTarget as HTMLElement).classList.add(
								'bg-primary/5',
								'border-primary',
								'border-dashed'
							)}
						ondragleave={(e) =>
							(e.currentTarget as HTMLElement).classList.remove(
								'bg-primary/5',
								'border-primary',
								'border-dashed'
							)}
					>
						<div class="space-y-3">
							{#each filteredTasks.filter((t) => t.status === col.id) as task (task.id)}
								<TaskItem
									{task}
									compact={compactMode}
									on:toggle={() => handleToggle(task)}
									on:requestEdit={(e) => openEdit(e.detail)}
									on:delete={() => requestDelete(task.id)}
									on:dragstart={() => (isDragging = true)}
									on:dragend={() => (isDragging = false)}
								/>
							{:else}
								<div class="flex flex-col items-center justify-center py-12 text-center opacity-40">
									<div class="p-3 mb-2 rounded-full bg-muted">
										<Plus class="w-5 h-5" />
									</div>
									<p class="text-xs font-medium">No tasks</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<Card>
			<CardContent class="p-0">
				<div class="divide-y">
					{#each filteredTasks as task (task.id)}
						<div class="p-1">
							<TaskItem
								{task}
								compact={compactMode}
								on:toggle={() => handleToggle(task)}
								on:requestEdit={(e) => openEdit(e.detail)}
								on:delete={() => requestDelete(task.id)}
							/>
						</div>
					{:else}
						<div class="py-20 text-center">
							<p class="text-muted-foreground">No tasks found matching your criteria.</p>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

<!-- Task Dialog -->
<Dialog bind:open>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle>{editingTaskId ? 'Edit Task' : 'Create New Task'}</DialogTitle>
			<DialogDescription>
				Add the details for your task here. Click save when you're done.
			</DialogDescription>
		</DialogHeader>

		<div class="grid gap-5 py-4">
			<div class="space-y-2">
				<Label for="title" class="text-xs font-bold tracking-wider uppercase">Title</Label>
				<Input
					id="title"
					bind:value={formTitle}
					placeholder="What needs to be done?"
					class="h-11"
				/>
			</div>

			<div class="space-y-2">
				<Label for="description" class="text-xs font-bold tracking-wider uppercase"
					>Description</Label
				>
				<Textarea
					id="description"
					bind:value={formDescription}
					placeholder="Add more details..."
					rows={3}
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="status" class="text-xs font-bold tracking-wider uppercase">Status</Label>
					<select
						id="status"
						bind:value={formStatus}
						class="h-10 w-full rounded-md border bg-background px-3"
					>
						<option value="to_do">To Do</option>
						<option value="in_progress">In Progress</option>
						<option value="waiting">Waiting</option>
						<option value="done">Done</option>
						<option value="archived">Archived</option>
					</select>
				</div>
				<div class="space-y-2">
					<Label for="priority" class="text-xs font-bold tracking-wider uppercase">Priority</Label>
					<select
						id="priority"
						bind:value={formPriority}
						class="h-10 w-full rounded-md border bg-background px-3"
					>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
					</select>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="dueDate" class="text-xs font-bold tracking-wider uppercase">Due Date</Label>
					<Input id="dueDate" type="date" bind:value={formDueDateStr} class="h-10" />
				</div>
				<div class="space-y-2">
					<Label for="project" class="text-xs font-bold tracking-wider uppercase">Project</Label>
					<select
						id="project"
						bind:value={formProjectId}
						class="h-10 w-full rounded-md border bg-background px-3"
					>
						<option value="">No Project</option>
						{#each $projectsStore as p}
							<option value={p.id}>{p.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<DialogFooter>
			<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={handleSave} class="px-8">Save Task</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<AlertDialog bind:open={showDeleteDialog}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>Are you sure?</AlertDialogTitle>
			<AlertDialogDescription>This will permanently delete this task.</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel onclick={() => (taskToDeleteId = null)}>Cancel</AlertDialogCancel>
			<AlertDialogAction
				onclick={confirmDelete}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				Delete
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>

<style>
	:global(.dragging) {
		cursor: grabbing !important;
	}
</style>
