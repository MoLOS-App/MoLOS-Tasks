<script lang="ts">
	import { page } from '$app/stores';
	const userId = $page.data.userId;
	import {
		projectsStore,
		areasStore,
		addProjectStore,
		updateProjectStore,
		deleteProjectStore,
		tasksStore
	} from '$lib/modules/MoLOS-Tasks/stores';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '$lib/components/ui/dialog/index.js';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle
	} from '$lib/components/ui/alert-dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Progress } from '$lib/components/ui/progress';
	import {
		Plus,
		Trash2,
		Calendar,
		Play,
		Pause,
		CheckCircle,
		Target,
		LayoutGrid,
		List,
		Search,
		X
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	// State
	let isDragging = $state(false);
	let showAddDialog = $state(false);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let editingProject = $state<any | null>(null);
	let deletingProject = $state<any | null>(null);
	let search = $state('');

	// Form State
	let formName = $state('');
	let formDescription = $state('');
	let formStatus = $state<'planning' | 'active' | 'paused' | 'done'>('planning');
	let formAreaId = $state('');
	let formStartDate = $state('');
	let formEndDate = $state('');

	// Logic
	const resetForm = () => {
		formName = '';
		formDescription = '';
		formStatus = 'planning';
		formAreaId = '';
		formStartDate = '';
		formEndDate = '';
		editingProject = null;
	};

	const openAdd = () => {
		resetForm();
		showAddDialog = true;
	};

	const openEdit = (project: any) => {
		editingProject = project;
		formName = project.name;
		formDescription = project.description || '';
		formStatus = project.status;
		formAreaId = project.areaId || '';
		formStartDate = project.startDate
			? new Date(project.startDate * 1000).toISOString().split('T')[0]
			: '';
		formEndDate = project.endDate
			? new Date(project.endDate * 1000).toISOString().split('T')[0]
			: '';
		showEditDialog = true;
	};

	const handleSave = async (isEdit = false) => {
		if (!formName.trim()) {
			toast.error('Project name is required');
			return;
		}

		const data = {
			name: formName.trim(),
			description: formDescription.trim() || undefined,
			status: formStatus,
			areaId: formAreaId || undefined,
			startDate: formStartDate ? Math.floor(new Date(formStartDate).getTime() / 1000) : undefined,
			endDate: formEndDate ? Math.floor(new Date(formEndDate).getTime() / 1000) : undefined,
			userId: userId
		};

		try {
			if (isEdit && editingProject) {
				await updateProjectStore(editingProject.id, data);
				toast.success('Project updated');
				showEditDialog = false;
			} else {
				await addProjectStore(data);
				toast.success('Project created');
				showAddDialog = false;
			}
			resetForm();
		} catch (err) {
			toast.error('Failed to save project');
		}
	};

	const handleDelete = async () => {
		if (deletingProject) {
			try {
				await deleteProjectStore(deletingProject.id);
				toast.success('Project deleted');
				showDeleteDialog = false;
				deletingProject = null;
			} catch (err) {
				toast.error('Failed to delete project');
			}
		}
	};

	const handleUpdateStatus = async (projectId: string, newStatus: any) => {
		try {
			await updateProjectStore(projectId, { status: newStatus });
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
		const projectId = e.dataTransfer!.getData('text/plain');
		if (projectId) {
			handleUpdateStatus(projectId, status);
		}
	}

	// Analytics
	const projectAnalytics = $derived(
		$projectsStore
			.map((project) => {
				const projectTasks = $tasksStore.filter((t) => t.projectId === project.id);
				const completed = projectTasks.filter((t) => t.isCompleted).length;
				const total = projectTasks.length;
				return {
					...project,
					taskCount: total,
					completedTasks: completed,
					completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
					activeTasks: total - completed
				};
			})
			.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
	);

	const columns = $derived([
		{ id: 'planning', title: 'Planning', color: 'var(--muted)', icon: Calendar },
		{ id: 'active', title: 'Active', color: 'var(--primary)', icon: Play },
		{ id: 'paused', title: 'Paused', color: 'var(--accent)', icon: Pause },
		{ id: 'done', title: 'Completed', color: 'var(--secondary)', icon: CheckCircle }
	]);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Project Board</h1>
			<p class="text-muted-foreground">Organize your work into manageable projects.</p>
		</div>
		<Button onclick={openAdd} class="rounded-full shadow-lg">
			<Plus class="mr-2 h-5 w-5" />
			New Project
		</Button>
	</div>

	<!-- Toolbar -->
	<div class="relative max-w-md">
		<Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
		<Input
			placeholder="Search projects..."
			bind:value={search}
			class="border-none bg-muted/30 pl-9 shadow-none focus-visible:ring-1"
		/>
		{#if search}
			<button
				class="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 hover:text-foreground"
				onclick={() => (search = '')}
			>
				<X class="h-4 w-4" />
			</button>
		{/if}
	</div>

	<!-- Kanban Board -->
	<div class="grid grid-cols-1 gap-6 overflow-x-auto pb-4 md:grid-cols-2 lg:grid-cols-4">
		{#each columns as col}
			<div class="flex min-w-[280px] flex-col gap-4">
				<div class="flex items-center justify-between px-2">
					<div class="flex items-center gap-2">
						<col.icon class="text-muted-foreground h-4 w-4" />
						<h3 class="text-muted-foreground text-sm font-bold tracking-widest uppercase">
							{col.title}
						</h3>
					</div>
					<Badge variant="secondary" class="h-5 rounded-full px-2 py-0 text-[10px] font-bold">
						{projectAnalytics.filter((p) => p.status === col.id).length}
					</Badge>
				</div>

				<div
					class="min-h-[500px] flex-1 rounded-xl border-2 border-transparent bg-muted/20 p-2 transition-colors"
					role="list"
					aria-label="{col.title} projects"
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
						{#each projectAnalytics.filter((p) => p.status === col.id) as project (project.id)}
							<Card
								class="group cursor-pointer border-l-4 transition-all hover:scale-[1.01] hover:shadow-md"
								style="border-left-color: {col.color}"
								draggable="true"
								ondragstart={(e) => {
									e.dataTransfer!.setData('text/plain', project.id);
									isDragging = true;
								}}
								ondragend={() => (isDragging = false)}
								onclick={() => openEdit(project)}
							>
								<CardContent class="space-y-3 p-4">
									<div class="flex items-start justify-between gap-2">
										<h4 class="text-sm leading-tight font-bold">{project.name}</h4>
										<button
											class="text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
											onclick={(e) => {
												e.stopPropagation();
												deletingProject = project;
												showDeleteDialog = true;
											}}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									</div>

									{#if project.description}
										<p class="text-muted-foreground line-clamp-2 text-xs">{project.description}</p>
									{/if}

									<div class="space-y-1.5">
										<div
											class="text-muted-foreground flex justify-between text-[10px] font-bold tracking-wider uppercase"
										>
											<span>Progress</span>
											<span>{project.completionRate}%</span>
										</div>
										<Progress value={project.completionRate} class="h-1" />
									</div>

									<div class="flex items-center justify-between pt-1">
										<div class="flex items-center gap-1.5">
											{#if project.areaId}
												{@const area = $areasStore.find((a) => a.id === project.areaId)}
												{#if area}
													<div
														class="h-2 w-2 rounded-full"
														style="background-color: {area.themeColor || 'currentColor'}"
													></div>
													<span class="text-muted-foreground text-[10px] font-medium"
														>{area.name}</span
													>
												{/if}
											{/if}
										</div>
										<span
											class="text-muted-foreground rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold"
										>
											{project.taskCount} tasks
										</span>
									</div>
								</CardContent>
							</Card>
						{:else}
							<div class="flex flex-col items-center justify-center py-12 text-center opacity-30">
								<Target class="w-8 h-8 mb-2" />
								<p class="text-xs font-medium">No projects</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Project Dialog -->
<Dialog bind:open={showAddDialog}>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle>Create New Project</DialogTitle>
			<DialogDescription>Define a new project to organize your tasks.</DialogDescription>
		</DialogHeader>
		<div class="grid gap-5 py-4">
			<div class="space-y-2">
				<Label for="name" class="text-xs font-bold tracking-wider uppercase">Project Name</Label>
				<Input id="name" bind:value={formName} placeholder="e.g., Website Redesign" class="h-11" />
			</div>
			<div class="space-y-2">
				<Label for="description" class="text-xs font-bold tracking-wider uppercase"
					>Description</Label
				>
				<Textarea
					id="description"
					bind:value={formDescription}
					placeholder="What is this project about?"
					rows={3}
				/>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="area" class="text-xs font-bold tracking-wider uppercase">Area</Label>
					<select
						id="area"
						bind:value={formAreaId}
						class="h-10 w-full rounded-md border bg-background px-3"
					>
						<option value="">No Area</option>
						{#each $areasStore as a}
							<option value={a.id}>{a.name}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-2">
					<Label for="status" class="text-xs font-bold tracking-wider uppercase">Status</Label>
					<select
						id="status"
						bind:value={formStatus}
						class="h-10 w-full rounded-md border bg-background px-3"
					>
						<option value="planning">Planning</option>
						<option value="active">Active</option>
						<option value="paused">Paused</option>
						<option value="done">Completed</option>
					</select>
				</div>
			</div>
		</div>
		<DialogFooter>
			<Button variant="ghost" onclick={() => (showAddDialog = false)}>Cancel</Button>
			<Button onclick={() => handleSave(false)} class="px-8">Create Project</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<Dialog bind:open={showEditDialog}>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle>Edit Project</DialogTitle>
			<DialogDescription>Update your project details.</DialogDescription>
		</DialogHeader>
		<div class="grid gap-5 py-4">
			<div class="space-y-2">
				<Label for="edit-name" class="text-xs font-bold tracking-wider uppercase"
					>Project Name</Label
				>
				<Input id="edit-name" bind:value={formName} class="h-11" />
			</div>
			<div class="space-y-2">
				<Label for="edit-description" class="text-xs font-bold tracking-wider uppercase"
					>Description</Label
				>
				<Textarea id="edit-description" bind:value={formDescription} rows={3} />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-area" class="text-xs font-bold tracking-wider uppercase">Area</Label>
					<select
						id="edit-area"
						bind:value={formAreaId}
						class="h-10 w-full rounded-md border bg-background px-3"
					>
						<option value="">No Area</option>
						{#each $areasStore as a}
							<option value={a.id}>{a.name}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-2">
					<Label for="edit-status" class="text-xs font-bold tracking-wider uppercase">Status</Label>
					<select
						id="edit-status"
						bind:value={formStatus}
						class="h-10 w-full rounded-md border bg-background px-3"
					>
						<option value="planning">Planning</option>
						<option value="active">Active</option>
						<option value="paused">Paused</option>
						<option value="done">Completed</option>
					</select>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-start" class="text-xs font-bold tracking-wider uppercase"
						>Start Date</Label
					>
					<Input id="edit-start" type="date" bind:value={formStartDate} class="h-10" />
				</div>
				<div class="space-y-2">
					<Label for="edit-end" class="text-xs font-bold tracking-wider uppercase">End Date</Label>
					<Input id="edit-end" type="date" bind:value={formEndDate} class="h-10" />
				</div>
			</div>
		</div>
		<DialogFooter>
			<Button variant="ghost" onclick={() => (showEditDialog = false)}>Cancel</Button>
			<Button onclick={() => handleSave(true)} class="px-8">Save Changes</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<AlertDialog bind:open={showDeleteDialog}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>Delete Project</AlertDialogTitle>
			<AlertDialogDescription>
				Are you sure you want to delete "{deletingProject?.name}"? This action cannot be undone and
				will unassign all tasks from this project.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel
				onclick={() => {
					showDeleteDialog = false;
					deletingProject = null;
				}}>Cancel</AlertDialogCancel
			>
			<AlertDialogAction
				onclick={handleDelete}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				Delete Project
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>

<style>
	:global(.dragging) {
		cursor: grabbing !important;
	}
</style>
