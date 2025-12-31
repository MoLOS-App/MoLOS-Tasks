import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, PUT, DELETE } from './+server';
import { TaskRepository } from '$lib/repositories/tasks';
import { createTestDb } from '$lib/test-utils';
import { error, json } from '@sveltejs/kit';

// Mock SvelteKit error and json helpers
vi.mock('@sveltejs/kit', () => ({
	error: vi.fn((status, message) => ({ status, message })),
	json: vi.fn((data, init) => ({ data, init }))
}));

// Mock TaskRepository to use in-memory DB
vi.mock('$lib/repositories/tasks', () => {
	return {
		TaskRepository: vi.fn().mockImplementation(function (this: any) {
			return (globalThis as any).mockRepoInstance;
		})
	};
});

describe('Tasks API', () => {
	let mockRepo: any;
	const userId = 'test-user-1';
	const mockLocals = { user: { id: userId } };

	beforeEach(async () => {
		vi.clearAllMocks();
		const db = await createTestDb();
		// We need a real instance but pointing to test DB
		const { TaskRepository: RealRepo } = (await vi.importActual('$lib/repositories/tasks')) as any;
		mockRepo = new RealRepo(db);
		(globalThis as any).mockRepoInstance = mockRepo;
	});

	it('GET should return tasks for user', async () => {
		await mockRepo.create({
			userId,
			title: 'Task 1',
			status: 'to_do',
			priority: 'medium',
			isCompleted: false
		});

		const response: any = await GET({ locals: mockLocals } as any);

		expect(response.data.length).toBe(1);
		expect(response.data[0].title).toBe('Task 1');
	});

	it('POST should create a new task', async () => {
		const newTask = { title: 'New Task', status: 'to_do', priority: 'high' };
		const request = {
			json: async () => newTask
		};

		const response: any = await POST({ locals: mockLocals, request } as any);

		expect(response.init.status).toBe(201);
		expect(response.data.title).toBe('New Task');
		expect(response.data.userId).toBe(userId);
	});

	it('PUT should update a task', async () => {
		const created = await mockRepo.create({
			userId,
			title: 'Old Title',
			status: 'to_do',
			priority: 'medium',
			isCompleted: false
		});
		const updates = { id: created.id, title: 'New Title', status: 'done' };
		const request = {
			json: async () => updates
		};

		const response: any = await PUT({ locals: mockLocals, request } as any);

		expect(response.data.title).toBe('New Title');
		expect(response.data.isCompleted).toBe(true);
	});

	it('DELETE should remove a task', async () => {
		const created = await mockRepo.create({
			userId,
			title: 'Delete me',
			status: 'to_do',
			priority: 'medium',
			isCompleted: false
		});
		const request = {
			json: async () => ({ id: created.id })
		};

		const response: any = await DELETE({ locals: mockLocals, request } as any);

		expect(response.data.success).toBe(true);
		const check = await mockRepo.getById(created.id, userId);
		expect(check).toBeNull();
	});

	it('should return 401 if not authenticated', async () => {
		await expect(GET({ locals: {} } as any)).rejects.toBeDefined();
		expect(error).toHaveBeenCalledWith(401, 'Unauthorized');
	});
});
