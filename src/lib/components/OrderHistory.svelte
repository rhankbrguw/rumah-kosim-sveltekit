<script>
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import ReviewModal from '$lib/components/ReviewModal.svelte';
	import { StarIcon } from 'lucide-svelte';

	let orders = [];
	let loading = true;
	let error = null;
	let expandedOrderId = null;
	let showReviewModal = false;
	let selectedProduct = null;

	onMount(async () => {
		const token = localStorage.getItem('authToken');
		if (!token) {
			window.location.href = '/client/login?redirect=/client/profiles/order-history';
			return;
		}
		await fetchOrderHistory(token);
	});

	async function fetchOrderHistory(token) {
		try {
			const [ordersResponse, reviewsResponse] = await Promise.all([
				axios.get('/api/orders', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				}),
				axios.get('/api/reviews', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				})
			]);

			const reviews = reviewsResponse.data;
			const reviewsMap = reviews.reduce((acc, review) => {
				const key = `${review.order_id}_${review.product_id}`;
				acc[key] = review;
				return acc;
			}, {});

			orders = ordersResponse.data.map((order) => ({
				...order,
				items: order.items.map((item) => {
					const reviewKey = `${order.id}_${item.product_id || item.id}`;
					const review = reviewsMap[reviewKey];
					return {
						...item,
						product_id: item.product_id || item.id,
						review: review || null,
						reviewed: !!review
					};
				})
			}));

			console.log('Fetched orders with reviews:', orders);
		} catch (err) {
			console.error('Error fetching order history:', err);
			error = err.response?.data?.error || 'Failed to load order history';
		} finally {
			loading = false;
		}
	}

	function toggleOrderDetails(orderId) {
		expandedOrderId = expandedOrderId === orderId ? null : orderId;
	}

	function getStatusColor(status) {
		const colors = {
			Processing: 'bg-amber-100 text-amber-800 border border-amber-200',
			Shipped: 'bg-blue-100 text-blue-800 border border-blue-200',
			Delivered: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
			Cancelled: 'bg-red-100 text-red-800 border border-red-200'
		};
		return colors[status] || 'bg-stone-100 text-stone-800 border border-stone-200';
	}

	async function handleReviewSubmit(event) {
		try {
			console.log('Review submission data:', event.detail);
			const token = localStorage.getItem('authToken');
			const response = await fetch('/api/reviews', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(event.detail)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to submit review');
			}

			showReviewModal = false;
			selectedProduct = null;

			alert('Review submitted successfully!');
			await fetchOrderHistory(token);
		} catch (error) {
			console.error('Review submission failed:', error);
			alert('Failed to submit review. Please try again.');
			throw error;
		}
	}
</script>

<div class="container mx-auto px-4 py-4 sm:px-6 sm:py-8 lg:max-w-5xl">
	<div class="mb-6 flex flex-col sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="-mt-8 mb-4 text-2xl font-bold text-stone-800 sm:mb-0 sm:text-3xl">Order History</h1>
	</div>

	{#if loading}
		<div class="flex justify-center py-8 sm:py-12">
			<div class="w-full animate-pulse space-y-4">
				{#each Array(3) as _}
					<div class="h-32 rounded-lg bg-stone-100 sm:h-40" />
				{/each}
			</div>
		</div>
	{:else if error}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-6">
			<p class="font-medium text-red-800">{error}</p>
		</div>
	{:else if orders.length === 0}
		<div class="rounded-lg border border-stone-200 bg-stone-50 p-8 text-center sm:p-12">
			<svg
				class="mx-auto mb-4 h-12 w-12 text-stone-400 sm:h-16 sm:w-16"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
			<p class="text-base text-stone-600 sm:text-lg">You haven't placed any orders yet.</p>
			<a
				href="/client/shop"
				class="mt-4 inline-block rounded-lg bg-amber-400 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-500 sm:px-6 sm:text-base"
			>
				Start Shopping
			</a>
		</div>
	{:else}
		<div class="space-y-4 sm:space-y-6">
			{#each orders as order}
				<div
					class="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
				>
					<div class="p-4 sm:p-6">
						<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-0">
							<div class="space-y-1">
								<p class="text-xs text-stone-500 sm:text-sm">
									{new Date(order.date).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</p>
								<p class="text-xs sm:text-sm">
									<span class="text-stone-800">Tracking:</span>
									<span class="ml-2 break-all font-mono font-medium text-blue-400"
										>{order.tracking_number}</span
									>
								</p>
							</div>
							<div
								class="flex flex-row items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start sm:space-y-2"
							>
								<div
									class={`inline-block rounded-full px-3 py-1 text-xs font-medium sm:px-4 sm:text-sm ${getStatusColor(
										order.status
									)}`}
								>
									{order.status}
								</div>
								<p class="text-lg font-semibold text-stone-600 sm:text-xl">
									Rp {parseInt(order.total).toLocaleString()}
								</p>
							</div>
						</div>

						<button
							class="mt-4 flex items-center text-xs font-medium text-amber-400 transition-colors hover:text-amber-600 sm:text-sm"
							on:click={() => toggleOrderDetails(order.id)}
						>
							{expandedOrderId === order.id ? 'Hide' : 'View'} Details
							<svg
								class="ml-1 h-4 w-4 transform transition-transform duration-200"
								class:rotate-180={expandedOrderId === order.id}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
					</div>

					{#if expandedOrderId === order.id}
						<div class="border-t border-stone-200 bg-stone-50 p-4 sm:p-6">
							<div class="space-y-4 sm:space-y-6">
								<div class="rounded-lg border border-stone-200 bg-white p-3 sm:p-4">
									<h4 class="mb-3 text-sm font-medium text-stone-600 sm:text-base">
										Shipping Details
									</h4>
									<div class="grid grid-cols-1 gap-3 text-xs sm:gap-4 sm:text-sm md:grid-cols-3">
										<div>
											<p class="text-stone-500">Method</p>
											<p class="font-medium text-stone-800">{order.shipping_method}</p>
										</div>
										<div class="md:col-span-2">
											<p class="text-stone-500">Address</p>
											<p class="break-words font-medium text-stone-800">{order.shipping_address}</p>
										</div>
									</div>
								</div>

								<div>
									<h4 class="mb-3 text-sm font-medium text-stone-800 sm:mb-4 sm:text-base">
										Order Items
									</h4>
									<div class="space-y-3 sm:space-y-4">
										{#each order.items as item}
											<div
												class="flex flex-col items-start gap-3 rounded-lg border border-stone-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
											>
												<img
													src={item.image}
													alt={item.title}
													class="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
												/>
												<div class="min-w-0 flex-1">
													<h5 class="truncate text-sm font-medium text-stone-800 sm:text-base">
														{item.title}
													</h5>
													<p class="mt-1 text-xs text-stone-500 sm:text-sm">
														{item.quantity} × Rp {parseInt(item.price_at_time).toLocaleString()}
													</p>
													{#if order.status === 'Delivered'}
														{#if item.reviewed}
															<div class="mt-2">
																<div class="flex items-center gap-1">
																	{#each Array(5) as _, i}
																		<StarIcon
																			size={14}
																			class={i < item.review.rating
																				? 'text-amber-400'
																				: 'text-stone-300'}
																		/>
																	{/each}
																</div>
																<p class="mt-1 text-xs text-stone-600 sm:text-sm">
																	{item.review.comment}
																</p>
															</div>
														{:else}
															<button
																class="mt-2 rounded-md bg-amber-400 px-2 py-1 text-xs text-white hover:bg-amber-500 sm:px-3 sm:text-sm"
																on:click={() => {
																	selectedProduct = {
																		id: item.product_id,
																		orderId: order.id,
																		title: item.title
																	};
																	console.log('Selected product:', selectedProduct);
																	showReviewModal = true;
																}}
															>
																Review
															</button>
														{/if}
													{/if}
												</div>
												<div class="w-full text-right sm:w-auto">
													<p class="text-sm font-semibold text-stone-600 sm:text-base">
														Rp {parseInt(item.quantity * item.price_at_time).toLocaleString()}
													</p>
												</div>
											</div>
										{/each}
									</div>
								</div>

								<div class="rounded-lg border border-stone-200 bg-white p-3 sm:p-4">
									<div class="space-y-2">
										<div class="flex justify-between text-xs sm:text-sm">
											<span class="text-stone-500">Subtotal</span>
											<span class="text-stone-800"
												>Rp {parseInt(order.total - order.shipping_price).toLocaleString()}</span
											>
										</div>
										<div class="flex justify-between text-xs sm:text-sm">
											<span class="text-stone-500">Shipping</span>
											<span class="text-stone-800"
												>Rp {parseInt(order.shipping_price).toLocaleString()}</span
											>
										</div>
										<div class="mt-2 border-t border-stone-200 pt-2">
											<div class="flex items-center justify-between">
												<span class="text-sm font-medium text-stone-800 sm:text-base">Total</span>
												<span class="text-lg font-semibold text-stone-900 sm:text-xl"
													>Rp {parseInt(order.total).toLocaleString()}</span
												>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<ReviewModal
	product={selectedProduct}
	isOpen={showReviewModal}
	on:close={() => {
		showReviewModal = false;
		selectedProduct = null;
	}}
	on:submit={handleReviewSubmit}
/>
