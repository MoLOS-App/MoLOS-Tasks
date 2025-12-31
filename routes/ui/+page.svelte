<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(async () => {
		await goto('/ui/tasks/dashboard');
	});
</script>

<div>Loading...</div>
