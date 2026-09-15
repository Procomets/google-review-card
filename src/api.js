/**
 * api.js — thin API client for the Google Review Link Generator backend.
 * The Google API key NEVER touches this file.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, body) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network connection problem. Please try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Prefer the server's human-readable error over a generic fallback
    throw new Error(
      data.error ||
        (res.status === 429
          ? 'Google Places request limit reached. Please try again later.'
          : res.status >= 500
          ? 'Unable to contact Google Places right now. Please try again.'
          : 'An unexpected error occurred.')
    );
  }

  return data;
}

/**
 * Send a Google Maps URL to the backend and get business info + review URL.
 * @param {string} mapsUrl
 */
export async function generateReviewLink(mapsUrl) {
  return request('/api/review-link', { mapsUrl });
}

/**
 * Confirm the user-selected business and get the review URL.
 * @param {{ placeId: string, name: string, address: string }} business
 */
export async function confirmBusiness(business) {
  return request('/api/confirm-business', business);
}
