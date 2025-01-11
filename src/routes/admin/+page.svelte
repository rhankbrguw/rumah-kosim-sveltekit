<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import axios from 'axios';
	import { auth } from '$lib/stores/auth';
	import { Pencil, Trash2, Plus, Upload } from 'lucide-svelte';

	let products = [];
	let orders = [];
	let activeTab = 'products';
	let searchTerm = '';
	let showAddModal = false;
	let showEditModal = false;
	let editingProduct = null;

	let newProduct = {
		title: '',
		description: '',
		price: '',
		quantity: '',
		image: ''
	};

	let stockEdit = {
		productId: null,
		quantity: 0
	};

	async function checkAdminAccess() {
		if (!browser) return false;
		const token = localStorage.getItem('authToken');
		const isAdmin = localStorage.getItem('isAdmin') === 'true';

		if (!token || !isAdmin) {
			goto('/client/login');
			return false;
		}

		try {
			const response = await axios.post('/api/auth/validate', { token });
			if (!response.data.success || response.data.user.role !== 'admin') {
				throw new Error('Not authorized');
			}
			auth.set({
				isAuthenticated: true,
				user: response.data.user,
				token,
				isAdmin: true
			});
			return true;
		} catch (error) {
			console.error('Admin validation error:', error);
			logout();
			return false;
		}
	}

	async function loadData() {
		const token = localStorage.getItem('authToken');
		if (!token) return;

		try {
			if (activeTab === 'products') {
				const response = await axios.get('/admin/api/products', {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (response.data.success) {
					products = response.data.products;
				}
			} else {
				const response = await axios.get('/admin/api/orders', {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (response.data.success) {
					orders = response.data.orders;
				}
			}
		} catch (error) {
			console.error('Load data error:', error);
			if (error.response?.status === 401) {
				goto('/client/login');
			}
		}
	}

	async function handleAddProduct() {
		try {
			// Log the data being sent
			console.log('Sending product data:', newProduct);

			// Basic validation
			if (!newProduct.title?.trim()) {
				alert('Title is required');
				return;
			}
			if (!newProduct.description?.trim()) {
				alert('Description is required');
				return;
			}
			if (!newProduct.image?.trim()) {
				alert('Image is required');
				return;
			}

			const price = Number(newProduct.price);
			if (isNaN(price) || price <= 0) {
				alert('Please enter a valid price');
				return;
			}

			const quantity = Number(newProduct.quantity);
			if (isNaN(quantity) || quantity < 0) {
				alert('Please enter a valid quantity');
				return;
			}

			const productData = {
				title: newProduct.title.trim(),
				description: newProduct.description.trim(),
				price: price,
				quantity: Math.floor(quantity),
				image: newProduct.image.trim()
			};

			const token = localStorage.getItem('authToken');
			const response = await axios.post('/admin/api/products', productData, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.data.success) {
				showAddModal = false;
				newProduct = {
					title: '',
					description: '',
					price: '',
					quantity: '',
					image: ''
				};
				await loadData();
				alert('Product added successfully!');
			}
		} catch (error) {
			console.error('Add product error:', error);
			const errorMessage = error.response?.data?.message || 'Error adding product';
			alert(errorMessage);
		}
	}

	async function handleUpdateStock(productId, newQuantity) {
		try {
			const token = localStorage.getItem('authToken');
			await axios.patch(
				'/admin/api/products/stock',
				{ productId, quantity: newQuantity },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			loadData();
		} catch (error) {
			console.error('Update stock error:', error);
			alert('Error updating stock');
		}
	}

	async function handleFileSelect(event, productId) {
		const file = event.target.files[0];
		if (!file) return;

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
		if (!allowedTypes.includes(file.type)) {
			alert('Please select a valid image file (JPEG, PNG, or GIF)');
			return;
		}

		const formData = new FormData();
		formData.append('image', file);

		try {
			const token = localStorage.getItem('authToken');
			const response = await axios.post('/admin/api/upload', formData, {
				headers: {
					Authorization: `Bearer ${token}`
					// Don't set Content-Type here - axios will set it automatically with boundary
				},
				// Add these options for better upload handling
				maxContentLength: Infinity,
				maxBodyLength: Infinity
			});

			if (response.data.success) {
				if (productId) {
					await axios.patch(
						'/admin/api/products',
						{ productId, image: response.data.imagePath },
						{ headers: { Authorization: `Bearer ${token}` } }
					);
					loadData();
				} else {
					newProduct.image = response.data.imagePath;
				}
			}
		} catch (error) {
			console.error('Upload error:', error);
			alert(error.response?.data?.message || 'Error uploading image');
		}
	}

	async function handleDeleteProduct(productId) {
		if (!confirm('Are you sure you want to delete this product?')) return;

		try {
			const token = localStorage.getItem('authToken');
			await axios.delete('/admin/api/products', {
				data: { productId },
				headers: { Authorization: `Bearer ${token}` }
			});
			loadData();
		} catch (error) {
			console.error('Delete product error:', error);
			alert('Error deleting product');
		}
	}

	function getStatusColor(status) {
		switch (status) {
			case 'Processing':
				return 'bg-yellow-500';
			case 'Shipping':
				return 'bg-amber-500';
			case 'Delivered':
				return 'bg-green-500';
			default:
				return 'bg-gray-500';
		}
	}

	async function updateOrderStatus(orderId, newStatus) {
		try {
			const token = localStorage.getItem('authToken');
			await axios.patch(
				'/admin/api/orders',
				{ orderId, status: newStatus },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			loadData();
		} catch (error) {
			console.error('Update order error:', error);
			alert('Error updating order status');
		}
	}

	onMount(async () => {
		if (await checkAdminAccess()) {
			loadData();
		}
	});
</script>

<div class="min-h-screen bg-gray-100">
	<div class="container mx-auto px-4 py-8">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="mt-20 text-3xl font-bold">Kosim<span class="text-amber-400">Book</span> Admin</h1>
		</div>

		<div class="mb-6 flex space-x-4">
			<button
				class="rounded-lg px-6 py-3 font-medium transition-colors {activeTab === 'products'
					? 'bg-orange-500 text-white'
					: 'bg-white text-gray-800'}"
				on:click={() => {
					activeTab = 'products';
					loadData();
				}}
			>
				Products
			</button>
			<button
				class="rounded-lg px-6 py-3 font-medium transition-colors {activeTab === 'orders'
					? 'bg-orange-500 text-white'
					: 'bg-white text-gray-800'}"
				on:click={() => {
					activeTab = 'orders';
					loadData();
				}}
			>
				Orders
			</button>
		</div>

		{#if activeTab === 'products'}
			<div>
				<div class="mb-6 flex items-center justify-between">
					<input
						type="text"
						class="w-full rounded border px-4 py-2"
						placeholder="Search products..."
						bind:value={searchTerm}
					/>
					<button
						class="ml-4 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
						on:click={() => (showAddModal = true)}
					>
						<Plus size="24" class="inline-block" />
						/> Add Product
					</button>
				</div>
				<table class="w-full border-collapse">
					<thead>
						<tr class="bg-gray-200">
							<th class="border px-4 py-2">Title</th>
							<th class="border px-4 py-2">Price</th>
							<th class="border px-4 py-2">Quantity</th>
							<th class="border px-4 py-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each products.filter((product) => product.title
								.toLowerCase()
								.includes(searchTerm.toLowerCase())) as product}
							<tr>
								<td class="border px-4 py-2">{product.title}</td>
								<td class="border px-4 py-2">${product.price}</td>
								<td class="border px-4 py-2">{product.quantity}</td>
								<td class="border px-4 py-2">
									<button
										class="mr-2 rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
										on:click={() => {
											showEditModal = true;
											editingProduct = product;
										}}
									>
										<Pencil size="16" class="inline-block" />
									</button>

									<button
										class="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
										on:click={() => handleDeleteProduct(product.id)}
									>
										<Trash2 class="inline-block" />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if activeTab === 'orders'}
			<div>
				<table class="w-full border-collapse">
					<thead>
						<tr class="bg-gray-200">
							<th class="border px-4 py-2">Order ID</th>
							<th class="border px-4 py-2">Total</th>
							<th class="border px-4 py-2">Status</th>
							<th class="border px-4 py-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each orders as order}
							<tr>
								<td class="border px-4 py-2">{order.id}</td>
								<td class="border px-4 py-2">${order.total}</td>
								<td class="border px-4 py-2">
									<span class="rounded px-2 py-1 text-white {getStatusColor(order.status)}">
										{order.status}
									</span>
								</td>
								<td class="border px-4 py-2">
									<select
										class="rounded border px-2 py-1"
										bind:value={order.status}
										on:change={(e) => updateOrderStatus(order.id, e.target.value)}
									>
										<option value="Processing">Processing</option>
										<option value="Shipping">Shipping</option>
										<option value="Delivered">Delivered</option>
									</select>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- Add Modal -->
		{#if showAddModal}
			<div class="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
				<div class="w-1/3 rounded-lg bg-white p-6">
					<h2 class="mb-4 text-xl font-bold">Add Product</h2>
					<input
						type="text"
						class="mb-3 w-full rounded border p-2"
						placeholder="Title"
						bind:value={newProduct.title}
					/>
					<input
						type="text"
						class="mb-3 w-full rounded border p-2"
						placeholder="Description"
						bind:value={newProduct.description}
					/>
					<input
						type="number"
						class="mb-3 w-full rounded border p-2"
						placeholder="Price"
						bind:value={newProduct.price}
					/>
					<input
						type="number"
						class="mb-3 w-full rounded border p-2"
						placeholder="Quantity"
						bind:value={newProduct.quantity}
					/>
					<input
						type="file"
						class="mb-3 w-full rounded border p-2"
						on:change={(e) => handleFileSelect(e, null)}
					/>
					<div class="flex justify-end">
						<button
							class="mr-3 rounded bg-gray-500 px-4 py-2 text-white"
							on:click={() => (showAddModal = false)}>Cancel</button
						>
						<button class="rounded bg-green-500 px-4 py-2 text-white" on:click={handleAddProduct}
							>Add</button
						>
					</div>
				</div>
			</div>
		{/if}

		<!-- Edit Modal -->
		{#if showEditModal}
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
				<div class="w-full max-w-md rounded-lg bg-white p-6">
					<h2 class="mb-4 text-xl font-bold">Update Stock</h2>
					<form
						on:submit|preventDefault={() => {
							handleUpdateStock(editingProduct.id, stockEdit.quantity);
							showEditModal = false;
						}}
						class="space-y-4"
					>
						<div>
							<label class="mb-1 block text-sm font-medium"
								>Current Stock: {editingProduct?.quantity}</label
							>
							<input
								type="number"
								bind:value={stockEdit.quantity}
								class="w-full rounded border p-2"
								min="0"
								required
							/>
						</div>
						<div class="flex justify-end space-x-3">
							<button
								type="button"
								class="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
								on:click={() => {
									showEditModal = false;
									editingProduct = null;
									stockEdit.quantity = 0;
								}}
							>
								Cancel
							</button>
							<button
								type="submit"
								class="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
							>
								Update Stock
							</button>
						</div>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
