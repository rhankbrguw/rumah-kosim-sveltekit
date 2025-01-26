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

	function formatIDR(number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(number);
	}

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

<div class="min-h-screen bg-[#F8F9FA]">
	<div class="container mx-auto px-4 py-4 sm:px-8 sm:py-8">
		<!-- Logo header -->
		<div class="mb-6 mt-16 sm:mb-8 sm:mt-20">
			<h1 class="text-xl font-bold sm:text-2xl">
				Kosim<span class="text-[#FF5C00]">Book</span> Admin
			</h1>
		</div>

		<!-- Tab buttons with updated styling -->
		<div class="mb-4 flex gap-2 sm:mb-6">
			<button
				class="rounded-[4px] px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:text-base {activeTab ===
				'products'
					? 'bg-[#FF5C00] text-white'
					: 'bg-white text-gray-800'}"
				on:click={() => {
					activeTab = 'products';
					loadData();
				}}
			>
				Product List
			</button>
			<button
				class="rounded-[4px] px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:text-base {activeTab ===
				'orders'
					? 'bg-[#FF5C00] text-white'
					: 'bg-white text-gray-800'}"
				on:click={() => {
					activeTab = 'orders';
					loadData();
				}}
			>
				Order List
			</button>
		</div>

		<!-- Products Table Section -->
		{#if activeTab === 'products'}
			<div class="rounded-lg bg-white p-3 shadow-sm sm:p-4">
				<div
					class="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-0"
				>
					<input
						type="text"
						class="w-full rounded-[4px] border border-gray-200 px-3 py-2 text-sm sm:w-64 sm:px-4 sm:text-base"
						placeholder="Search products..."
						bind:value={searchTerm}
					/>
					<button
						class="flex items-center justify-center gap-2 rounded-[4px] bg-[#FF5C00] px-4 py-2 text-sm text-white hover:bg-[#FF5C00]/90 sm:text-base"
						on:click={() => (showAddModal = true)}
					>
						<Plus size="18" />
						Add Product
					</button>
				</div>

				<!-- Updated Products Table -->
				<div class="hidden sm:block">
					<table class="w-full">
						<thead>
							<tr class="border-b text-left">
								<th class="pb-4 font-medium text-gray-600">Title</th>
								<th class="pb-4 font-medium text-gray-600">Price</th>
								<th class="pb-4 font-medium text-gray-600">Stock</th>
								<th class="pb-4 font-medium text-gray-600">Picture</th>
								<th class="pb-4 font-medium text-gray-600">Action</th>
							</tr>
						</thead>
						<tbody>
							{#each products.filter((product) => product.title
									.toLowerCase()
									.includes(searchTerm.toLowerCase())) as product}
								<tr class="border-b">
									<td class="py-4">{product.title}</td>
									<td class="py-4">{formatIDR(product.price)}</td>
									<td class="py-4">{product.quantity}</td>
									<td class="py-4">
										<div class="flex items-center gap-2">
											<img
												src={product.image}
												alt={product.title}
												class="h-10 w-10 rounded-sm object-cover"
											/>
											<label
												class="cursor-pointer rounded-[4px] bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
											>
												<input
													type="file"
													class="hidden"
													on:change={(e) => handleFileSelect(e, product.id)}
													accept="image/*"
												/>
												Upload Image
											</label>
										</div>
									</td>
									<td class="py-4">
										<div class="flex gap-2">
											<button
												class="rounded-[4px] bg-blue-500 p-1.5 text-white hover:bg-blue-600"
												on:click={() => {
													showEditModal = true;
													editingProduct = product;
													stockEdit.quantity = product.quantity;
												}}
											>
												<Pencil size="16" />
											</button>
											<button
												class="rounded-[4px] bg-red-500 p-1.5 text-white hover:bg-red-600"
												on:click={() => handleDeleteProduct(product.id)}
											>
												<Trash2 size="16" />
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Mobile View -->
				<div class="space-y-4 sm:hidden">
					{#each products.filter((product) => product.title
							.toLowerCase()
							.includes(searchTerm.toLowerCase())) as product}
						<div class="space-y-3 rounded-lg border p-3">
							<div class="flex items-center gap-3">
								<img
									src={product.image}
									alt={product.title}
									class="h-16 w-16 rounded-sm object-cover"
								/>
								<div>
									<h3 class="font-medium">{product.title}</h3>
									<p class="text-gray-600">{formatIDR(product.price)}</p>
									<p class="text-sm text-gray-500">Stock: {product.quantity}</p>
								</div>
							</div>

							<div class="flex items-center justify-between pt-2">
								<label
									class="cursor-pointer rounded-[4px] bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
								>
									<input
										type="file"
										class="hidden"
										on:change={(e) => handleFileSelect(e, product.id)}
										accept="image/*"
									/>
									Upload Image
								</label>
								<div class="flex gap-2">
									<button
										class="rounded-[4px] bg-blue-500 p-1.5 text-white hover:bg-blue-600"
										on:click={() => {
											showEditModal = true;
											editingProduct = product;
											stockEdit.quantity = product.quantity;
										}}
									>
										<Pencil size="16" />
									</button>
									<button
										class="rounded-[4px] bg-red-500 p-1.5 text-white hover:bg-red-600"
										on:click={() => handleDeleteProduct(product.id)}
									>
										<Trash2 size="16" />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'orders'}
			<!-- Orders Table Section -->
			<div class="rounded-lg bg-white p-3 shadow-sm sm:p-4">
				<!-- Desktop Table (hidden on mobile) -->
				<div class="hidden sm:block">
					<table class="w-full">
						<thead>
							<tr class="border-b text-left">
								<th class="pb-4 font-medium text-gray-600">Order ID</th>
								<th class="pb-4 font-medium text-gray-600">Title</th>
								<th class="pb-4 font-medium text-gray-600">Username</th>
								<th class="pb-4 font-medium text-gray-600">Qty</th>
								<th class="pb-4 font-medium text-gray-600">Price/pcs</th>
								<th class="pb-4 font-medium text-gray-600">Total</th>
								<th class="pb-4 font-medium text-gray-600">Status</th>
								<th class="pb-4 font-medium text-gray-600">Action</th>
							</tr>
						</thead>
						<tbody>
							{#each orders as order}
								<tr class="border-b">
									<td class="py-4">#{order.id}</td>
									<td class="py-4">{order.title}</td>
									<td class="py-4">{order.username}</td>
									<td class="py-4">{order.quantity}</td>
									<td class="py-4">{formatIDR(order.price_at_time)}</td>
									<td class="py-4">{formatIDR(order.total)}</td>
									<td class="py-4">
										<span
											class="rounded-full px-3 py-1 text-sm text-white {getStatusColor(
												order.status
											)}"
										>
											{order.status}
										</span>
									</td>
									<td class="py-4">
										<select
											class="rounded-[4px] border border-gray-200 px-3 py-1.5 text-sm"
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

				<!-- Mobile Card View -->
				<div class="space-y-4 sm:hidden">
					{#each orders as order}
						<div class="space-y-3 rounded-lg border p-3">
							<div class="space-y-2">
								<div class="flex items-start justify-between">
									<div>
										<p class="text-sm text-gray-500">Order #{order.id}</p>
										<h3 class="font-medium">{order.title}</h3>
										<p class="text-sm text-gray-500">{order.username}</p>
									</div>
									<span
										class="rounded-full px-3 py-1 text-sm text-white {getStatusColor(order.status)}"
									>
										{order.status}
									</span>
								</div>

								<div class="grid grid-cols-2 gap-2 text-sm">
									<div>
										<p class="text-gray-500">Quantity</p>
										<p>{order.quantity}</p>
									</div>
									<div>
										<p class="text-gray-500">Price/pcs</p>
										<p>{formatIDR(order.price_at_time)}</p>
									</div>
								</div>

								<div class="pt-2">
									<p class="text-sm text-gray-500">Total</p>
									<p class="font-medium">{formatIDR(order.total)}</p>
								</div>
							</div>

							<div class="border-t pt-2">
								<select
									class="w-full rounded-[4px] border border-gray-200 px-3 py-2 text-sm"
									bind:value={order.status}
									on:change={(e) => updateOrderStatus(order.id, e.target.value)}
								>
									<option value="Processing">Processing</option>
									<option value="Shipping">Shipping</option>
									<option value="Delivered">Delivered</option>
								</select>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Modal -->
		<!-- Add Product -->
		{#if showAddModal}
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 pb-6 pt-24">
				<div class="w-full max-w-[400px] rounded-lg bg-white p-4 sm:p-5">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-800">Add Product</h2>
						<button
							class="text-gray-500 hover:text-gray-700"
							on:click={() => (showAddModal = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<div class="space-y-3">
						<!-- Title -->
						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
							<input
								type="text"
								class="w-full rounded-[4px] border border-gray-200 px-3 py-2 focus:border-[#FF5C00] focus:outline-none focus:ring-1 focus:ring-[#FF5C00]"
								placeholder="Enter product title"
								bind:value={newProduct.title}
							/>
						</div>

						<!-- Description -->
						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
							<textarea
								class="w-full rounded-[4px] border border-gray-200 px-4 py-2.5 focus:border-[#FF5C00] focus:outline-none focus:ring-1 focus:ring-[#FF5C00]"
								placeholder="Enter product description"
								rows="2"
								bind:value={newProduct.description}
							></textarea>
						</div>

						<!-- Price & Quantity Row -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="mb-1.5 block text-sm font-medium text-gray-700">Price</label>
								<input
									type="number"
									class="w-full rounded-[4px] border border-gray-200 px-4 py-2.5 focus:border-[#FF5C00] focus:outline-none focus:ring-1 focus:ring-[#FF5C00]"
									placeholder="0.00"
									bind:value={newProduct.price}
								/>
							</div>
							<div>
								<label class="mb-1.5 block text-sm font-medium text-gray-700">Quantity</label>
								<input
									type="number"
									class="w-full rounded-[4px] border border-gray-200 px-4 py-2.5 focus:border-[#FF5C00] focus:outline-none focus:ring-1 focus:ring-[#FF5C00]"
									placeholder="0"
									bind:value={newProduct.quantity}
								/>
							</div>
						</div>

						<!-- Image Upload -->
						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-700">Product Image</label>
							<div class="relative">
								<input
									type="file"
									class="hidden"
									id="productImage"
									on:change={(e) => handleFileSelect(e, null)}
									accept="image/*"
								/>
								<label
									for="productImage"
									class="flex cursor-pointer items-center gap-2 rounded-[4px] border border-gray-200 px-4 py-2.5 text-gray-500 hover:bg-gray-50"
								>
									<Upload size={18} />
									<span>Upload image</span>
								</label>
								{#if newProduct.image}
									<p class="mt-2 text-sm text-green-600">Image uploaded successfully</p>
								{/if}
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="mt-5 flex justify-end gap-3">
						<button
							class="rounded-[4px] border border-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-50"
							on:click={() => (showAddModal = false)}
						>
							Cancel
						</button>
						<button
							class="rounded-[4px] bg-[#FF5C00] px-6 py-2 text-white hover:bg-[#FF5C00]/90"
							on:click={handleAddProduct}
						>
							Add Product
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Edit Stock -->
		{#if showEditModal}
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
				<div class="w-full max-w-[400px] rounded-lg bg-white p-4 sm:p-6">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-800">Update Stock</h2>
						<button
							class="text-gray-500 hover:text-gray-700"
							on:click={() => {
								showEditModal = false;
								editingProduct = null;
								stockEdit.quantity = 0;
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<form
						on:submit|preventDefault={() => {
							handleUpdateStock(editingProduct.id, stockEdit.quantity);
							showEditModal = false;
						}}
						class="space-y-4"
					>
						<!-- Current Stock -->
						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-700">Current Stock</label>
							<p class="mb-4 text-sm text-gray-500">Current quantity: {editingProduct?.quantity}</p>
							<input
								type="number"
								bind:value={stockEdit.quantity}
								class="w-full rounded-[4px] border border-gray-200 px-4 py-2.5 focus:border-[#FF5C00] focus:outline-none focus:ring-1 focus:ring-[#FF5C00]"
								min="0"
								placeholder="Enter new quantity"
								required
							/>
						</div>

						<!-- Action Buttons -->
						<div class="mt-6 flex justify-end gap-3">
							<button
								type="button"
								class="rounded-[4px] border border-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-50"
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
								class="rounded-[4px] bg-[#FF5C00] px-6 py-2 text-white hover:bg-[#FF5C00]/90"
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
