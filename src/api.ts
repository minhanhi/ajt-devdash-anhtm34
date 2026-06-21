import { Product, Category, ProductsResponse } from './types';

/**
 * Generic fetch function to retrieve typed JSON from a URL.
 * Handles HTTP failures and catch blocks to return explicit error messages.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    const data: T = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Network failure: ${error.message}`);
    }
    throw new Error(`An unknown error occurred during network request.`);
  }
}

/**
 * Fetches products list with a limit of 100 to populate the catalog.
 */
export async function fetchProducts(): Promise<ProductsResponse> {
  return fetchJson<ProductsResponse>('https://dummyjson.com/products?limit=100');
}

/**
 * Fetches the available product categories.
 */
export async function fetchCategories(): Promise<Category[]> {
  return fetchJson<Category[]>('https://dummyjson.com/products/categories');
}

/**
 * Fetches the details of a single product by ID.
 */
export async function fetchProductDetail(id: number): Promise<Product> {
  return fetchJson<Product>(`https://dummyjson.com/products/${id}`);
}
