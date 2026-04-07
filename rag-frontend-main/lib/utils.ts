// import { clsx, type ClassValue } from "clsx"
// import { twMerge } from "tailwind-merge"

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }


import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Existing cn function for Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Backend configuration
export const BACKEND_URL = "http://localhost:8000"

// Generic API fetch function
export async function fetchFromBackend(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`)
  }
  
  // Handle cases where response might be empty
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

// Specific API functions for your RAG application
export const ragAPI = {
  // Send a query to the RAG backend - MATCHES YOUR api.py
  query: async (queryText: string) => {
    return fetchFromBackend('/query', {
      method: 'POST',
      body: JSON.stringify({ query: queryText }), // Note: field name is 'query', not 'question'
    })
  },
  
  // Health check
  healthCheck: async () => {
    return fetchFromBackend('/health')
  },
  
  // Get database statistics
  getStats: async () => {
    return fetchFromBackend('/stats')
  },
  
  // Initialize database with research papers
  initializeDatabase: async () => {
    return fetchFromBackend('/init', { method: 'POST' })
  },
}

// Simple fetch function for one-off calls
export async function callBackend(endpoint: string, method: string = 'GET', data?: any) {
  const options: RequestInit = { method }
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data)
    options.headers = {
      'Content-Type': 'application/json',
    }
  }
  
  return fetchFromBackend(endpoint, options)
}