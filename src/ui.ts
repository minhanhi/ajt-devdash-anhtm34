import { AppState, Product, Category } from './types';

// Helper to safely select elements with proper types
export function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Element with ID "${id}" was not found in the DOM.`);
  }
  return el as T;
}

/**
 * Populate the category dropdown list.
 * Run once when categories are successfully loaded.
 */
export function populateCategoriesDropdown(categories: Category[]): void {
  const select = getElement<HTMLSelectElement>('category-select');
  
  // Clear any existing options except the first "All Categories" option
  select.innerHTML = '<option value="">All Categories</option>';
  
  // Use map to create elements and append them
  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat.slug;
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

/**
 * Render stars representation based on rating count (max 5)
 */
function renderStars(rating: number): string {
  const rounded = Math.round(rating);
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= rounded ? '★' : '☆';
  }
  return stars;
}

/**
 * Calculates discounted price: original price * (1 - discountPercent / 100)
 */
function calculateDiscountedPrice(price: number, discountPercentage: number): number {
  return price * (1 - discountPercentage / 100);
}

/**
 * Render the product list grid.
 */
function renderProductsGrid(products: Product[]): string {
  if (products.length === 0) return '';

  return products
    .map((product) => {
      const discPrice = calculateDiscountedPrice(product.price, product.discountPercentage);
      const isLowStock = product.stock < 10;
      const stockText = isLowStock ? `Only ${product.stock} left` : 'In Stock';
      const stockClass = isLowStock ? 'stock-low' : 'stock-ok';
      
      return `
        <div class="product-card" data-product-id="${product.id}">
          <div class="card-img-wrapper">
            <span class="card-badge-discount">-${Math.round(product.discountPercentage)}%</span>
            <img class="card-img" src="${product.thumbnail}" alt="${product.title}" loading="lazy" />
          </div>
          <div class="card-body">
            <span class="card-category">${product.category}</span>
            <h3 class="card-title">${product.title}</h3>
            
            <div class="card-rating">
              <span>${renderStars(product.rating)}</span>
              <span class="card-rating-text">(${product.rating.toFixed(1)})</span>
            </div>

            <div class="card-footer">
              <div class="price-box">
                <span class="price-original">$${product.price.toFixed(2)}</span>
                <span class="price-current">$${discPrice.toFixed(2)}</span>
              </div>
              <span class="stock-status ${stockClass}">${stockText}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

/**
 * Generates the HTML for the product detail view inside the modal.
 */
export function renderProductDetails(product: Product): string {
  const discountedPrice = calculateDiscountedPrice(product.price, product.discountPercentage);
  const isLowStock = product.stock < 10;
  const stockText = isLowStock ? `Low Stock (${product.stock} items left)` : `In Stock (${product.stock} available)`;
  const stockClass = isLowStock ? 'stock-low' : 'stock-ok';

  // Sub-images gallery
  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail];
  const mainImageSrc = images[0];

  const thumbnailsHtml = images
    .map((img, idx) => `
      <img 
        src="${img}" 
        alt="Thumbnail ${idx + 1}" 
        class="detail-thumb ${idx === 0 ? 'active' : ''}" 
        data-image-index="${idx}"
      />
    `)
    .join('');

  // Dimensions
  const dims = product.dimensions 
    ? `${product.dimensions.width} W × ${product.dimensions.height} H × ${product.dimensions.depth} D cm`
    : 'N/A';

  // Reviews
  const reviewsHtml = product.reviews && product.reviews.length > 0
    ? product.reviews
        .map((rev) => {
          const dateStr = new Date(rev.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          return `
            <div class="review-card">
              <div class="review-header">
                <span class="review-author">${rev.reviewerName}</span>
                <span class="review-date">${dateStr}</span>
              </div>
              <div class="review-rating">${renderStars(rev.rating)}</div>
              <p class="review-comment">"${rev.comment}"</p>
            </div>
          `;
        })
        .join('')
    : '<p class="state-message">No customer reviews yet.</p>';

  return `
    <div class="detail-layout">
      <!-- Gallery Column -->
      <div class="detail-gallery">
        <img id="detail-main-display" class="detail-main-img" src="${mainImageSrc}" alt="${product.title}" />
        <div class="detail-thumbnails" id="detail-thumbnails-container">
          ${thumbnailsHtml}
        </div>
      </div>

      <!-- Information Column -->
      <div class="detail-info">
        <span class="detail-category">${product.category}</span>
        <h2 id="modal-product-title" class="detail-title">${product.title}</h2>
        
        <div class="detail-meta-row">
          <span class="rating-pill">
            ★ ${product.rating.toFixed(1)} Rating
          </span>
          ${product.brand ? `<span class="brand-pill">${product.brand}</span>` : ''}
          <span class="stock-status ${stockClass}">${stockText}</span>
        </div>

        <p class="detail-description">${product.description}</p>

        <div class="detail-pricing">
          <span class="price-original" style="font-size: 1.1rem; margin-right: 0.5rem;">
            $${product.price.toFixed(2)}
          </span>
          <span class="detail-price-current">$${discountedPrice.toFixed(2)}</span>
          <span class="detail-discount-percent">SAVE ${Math.round(product.discountPercentage)}%</span>
        </div>

        <div class="detail-specs">
          <div class="spec-item">
            <span class="spec-label">SKU</span>
            <span class="spec-value">${product.sku || 'N/A'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Weight</span>
            <span class="spec-value">${product.weight ? `${product.weight} kg` : 'N/A'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Dimensions</span>
            <span class="spec-value">${dims}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Warranty</span>
            <span class="spec-value">${product.warrantyInformation || 'N/A'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Return Policy</span>
            <span class="spec-value">${product.returnPolicy || 'N/A'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Shipping</span>
            <span class="spec-value">${product.shippingInformation || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Reviews Section -->
    <div class="detail-reviews">
      <h3 class="reviews-title">Customer Reviews</h3>
      <div class="reviews-list">
        ${reviewsHtml}
      </div>
    </div>
  `;
}

/**
 * Main application renderer mapping the AppState onto the DOM tree.
 */
export function renderApp(state: AppState): void {
  // Elements lookup
  const loadingState = getElement<HTMLDivElement>('loading-state');
  const errorState = getElement<HTMLDivElement>('error-state');
  const productsGrid = getElement<HTMLDivElement>('products-grid');
  const emptyState = getElement<HTMLDivElement>('empty-state');
  const resultsCount = getElement<HTMLSpanElement>('results-count');
  const resetFiltersBtn = getElement<HTMLButtonElement>('reset-filters-btn');
  const errorMessage = getElement<HTMLParagraphElement>('error-message');
  const detailModal = getElement<HTMLDivElement>('detail-modal');
  const modalContent = getElement<HTMLDivElement>('modal-content');

  // 1. Process Main Screen States (loading / success / error)
  if (state.status === 'loading') {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    productsGrid.classList.add('hidden');
    emptyState.classList.add('hidden');
    resultsCount.textContent = 'Synchronizing catalog...';
    resetFiltersBtn.classList.add('hidden');
  } 
  else if (state.status === 'error') {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    productsGrid.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorMessage.textContent = state.error || 'Failed to populate data from network.';
    resultsCount.textContent = 'Retrieval failed.';
    resetFiltersBtn.classList.add('hidden');
  } 
  else if (state.status === 'success') {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');

    // Filter products using Higher-Order Functions (.filter)
    let filtered = state.products.filter((prod) => {
      const matchesSearch = prod.title.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchesCategory = state.selectedCategory === '' || prod.category === state.selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort products using Higher-Order Function (.sort)
    if (state.sortBy !== '') {
      filtered = [...filtered].sort((a, b) => {
        if (state.sortBy === 'title-asc') {
          return a.title.localeCompare(b.title);
        } else if (state.sortBy === 'title-desc') {
          return b.title.localeCompare(a.title);
        } else if (state.sortBy === 'price-asc') {
          const priceA = calculateDiscountedPrice(a.price, a.discountPercentage);
          const priceB = calculateDiscountedPrice(b.price, b.discountPercentage);
          return priceA - priceB;
        } else if (state.sortBy === 'price-desc') {
          const priceA = calculateDiscountedPrice(a.price, a.discountPercentage);
          const priceB = calculateDiscountedPrice(b.price, b.discountPercentage);
          return priceB - priceA;
        }
        return 0;
      });
    }

    // Render results view grid
    if (filtered.length === 0) {
      productsGrid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      resultsCount.textContent = `No items found matching filter.`;
    } else {
      emptyState.classList.add('hidden');
      productsGrid.classList.remove('hidden');
      productsGrid.innerHTML = renderProductsGrid(filtered);
      resultsCount.textContent = `Showing ${filtered.length} of ${state.products.length} products`;
    }

    // Toggle reset filters button visibility
    const hasActiveFilters = state.searchQuery !== '' || state.selectedCategory !== '' || state.sortBy !== '';
    if (hasActiveFilters) {
      resetFiltersBtn.classList.remove('hidden');
    } else {
      resetFiltersBtn.classList.add('hidden');
    }
  }

  // 2. Process Details Modal State
  if (state.selectedProduct) {
    modalContent.innerHTML = renderProductDetails(state.selectedProduct);
    
    // Add sub-image click display listeners
    const galleryContainer = document.getElementById('detail-thumbnails-container');
    const mainDisplay = document.getElementById('detail-main-display') as HTMLImageElement;
    if (galleryContainer && mainDisplay) {
      const images = state.selectedProduct.images && state.selectedProduct.images.length > 0
        ? state.selectedProduct.images
        : [state.selectedProduct.thumbnail];

      galleryContainer.addEventListener('click', (e) => {
        const thumb = (e.target as HTMLElement).closest('.detail-thumb');
        if (thumb) {
          const index = Number(thumb.getAttribute('data-image-index'));
          mainDisplay.src = images[index];
          // Highlight active thumb
          galleryContainer.querySelectorAll('.detail-thumb').forEach((t) => t.classList.remove('active'));
          thumb.classList.add('active');
        }
      });
    }

    detailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Disable background scroll
  } else {
    detailModal.classList.add('hidden');
    document.body.style.overflow = ''; // Re-enable scroll
  }
}
