'use client';

/**
 * Utility functions for making API calls from client components
 * Use these instead of importing MongoDB/Mongoose models directly in client components
 */

/**
 * Fetch data from an API endpoint with error handling
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - The fetched data
 */
export async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `API request failed with status ${response.status}`,
      }));
      throw new Error(error.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Post data to an API endpoint
 * @param {string} url - The API endpoint URL
 * @param {Object} data - The data to post
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} - The response data
 */
export async function postData(url, data, options = {}) {
  return fetchData(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * Update data via an API endpoint
 * @param {string} url - The API endpoint URL
 * @param {Object} data - The data to update
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} - The response data
 */
export async function updateData(url, data, options = {}) {
  return fetchData(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * Delete a resource via an API endpoint
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} - The response data
 */
export async function deleteData(url, options = {}) {
  return fetchData(url, {
    method: 'DELETE',
    ...options,
  });
}
