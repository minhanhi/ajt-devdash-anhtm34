import { fetchProducts, fetchCategories, fetchProductDetail } from './api';
import { getState, updateState, subscribe } from './state';
import { renderApp, populateCategoriesDropdown, getElement } from './ui';

/**
 * Executes concurrent retrieval of products and categories.
 * Updates state upon load completion or error.
 */
async function loadDashboardData(): Promise<void> {
  updateState({ status: 'loading', error: null });
  
  try {
    // Parallel loading (Good tier): Load products and categories concurrently
    const [productsRes, categories] = await Promise.all([
      fetchProducts(),
      fetchCategories()
    ]);
    
    // Populate categories select dropdown menu in DOM
    populateCategoriesDropdown(categories);
    
    // Complete transition to success state
    updateState({
      status: 'success',
      products: productsRes.products,
      categories: categories
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database synchronization error.';
    updateState({
      status: 'error',
      error: message
    });
  }
}

/**
 * Binds DOM event listeners to user control inputs.
 */
function setupEventListeners(): void {
  const searchInput = getElement<HTMLInputElement>('search-input');
  const categorySelect = getElement<HTMLSelectElement>('category-select');
  const sortSelect = getElement<HTMLSelectElement>('sort-select');
  const resetBtn = getElement<HTMLButtonElement>('reset-filters-btn');
  const retryBtn = getElement<HTMLButtonElement>('retry-btn');
  const productsGrid = getElement<HTMLDivElement>('products-grid');
  
  const modalOverlay = getElement<HTMLDivElement>('detail-modal');
  const modalCloseBtn = getElement<HTMLButtonElement>('modal-close-btn');

  // Search input filter binding
  searchInput.addEventListener('input', () => {
    updateState({ searchQuery: searchInput.value });
  });

  // Category select filter binding
  categorySelect.addEventListener('change', () => {
    updateState({ selectedCategory: categorySelect.value });
  });

  // Sorting select binding
  sortSelect.addEventListener('change', () => {
    updateState({ sortBy: sortSelect.value as any });
  });

  // Clear filters trigger binding
  const clearFilters = (): void => {
    searchInput.value = '';
    categorySelect.value = '';
    sortSelect.value = '';
    updateState({
      searchQuery: '',
      selectedCategory: '',
      sortBy: ''
    });
  };
  resetBtn.addEventListener('click', clearFilters);

  // Network retry handler binding
  retryBtn.addEventListener('click', () => {
    loadDashboardData();
  });

  // Click on product card to open details modal (Event delegation)
  productsGrid.addEventListener('click', async (e) => {
    const card = (e.target as HTMLElement).closest('.product-card');
    if (!card) return;

    const productId = Number(card.getAttribute('data-product-id'));
    
    // Find item locally first to render instantly
    const localProduct = getState().products.find(p => p.id === productId);
    if (localProduct) {
      updateState({ selectedProduct: localProduct });
    }

    // Detail view (Pass tier): fetch detailed data by id from the API
    try {
      const detailedProduct = await fetchProductDetail(productId);
      
      // Update details view state if the user hasn't switched details or closed
      const currentSelected = getState().selectedProduct;
      if (currentSelected && currentSelected.id === productId) {
        updateState({ selectedProduct: detailedProduct });
      }
    } catch (err) {
      // Log errors gracefully without interrupting the visual UX
      console.warn(`Failed to fetch fresh product details for ID ${productId}:`, err);
    }
  });

  // Details Modal close bindings
  const closeModal = (): void => {
    updateState({ selectedProduct: null });
  };
  modalCloseBtn.addEventListener('click', closeModal);

  // Close when clicking modal backdrop
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Close details with Esc keypress
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && getState().selectedProduct !== null) {
      closeModal();
    }
  });
}

// Bootstraps application modules on script execution
function init(): void {
  // Bind UI renderer to state store changes
  subscribe(renderApp);
  
  // Connect dashboard inputs and interactive click nodes
  setupEventListeners();
  
  // Trigger initial database sync
  loadDashboardData();
}

// Run bootstrap when DOM is interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
