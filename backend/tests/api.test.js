/**
 * Backend API tests for Google Review Link Generator
 * Run with: node tests/api.test.js
 * (Ensure backend is running on http://localhost:5000)
 */

const BASE_URL = 'http://localhost:5000';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${name}`);
    console.error(`      ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function post(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Tests
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n🧪  Running API tests...\n');

// 1. Health check
await test('Health check returns 200 and status ok', async () => {
  const res = await fetch(BASE_URL + '/api/health');
  const data = await res.json();
  assert(res.status === 200, 'Expected 200');
  assert(data.status === 'ok', 'Expected status: ok');
});

// 2. Empty URL
await test('Empty URL returns 400', async () => {
  const { status, data } = await post('/api/review-link', { mapsUrl: '' });
  assert(status === 400, `Expected 400, got ${status}`);
  assert(!data.success, 'Expected success: false');
  assert(typeof data.error === 'string', 'Expected error string');
});

// 3. Missing mapsUrl field
await test('Missing mapsUrl returns 400', async () => {
  const { status, data } = await post('/api/review-link', {});
  assert(status === 400, `Expected 400, got ${status}`);
  assert(!data.success, 'Expected success: false');
});

// 4. Invalid URL (not Google)
await test('Non-Google URL returns 400', async () => {
  const { status, data } = await post('/api/review-link', {
    mapsUrl: 'https://example.com/place/somebusiness',
  });
  assert(status === 400, `Expected 400, got ${status}`);
  assert(!data.success, 'Expected success: false');
});

// 5. Invalid URL format (garbage)
await test('Garbage URL returns 400', async () => {
  const { status, data } = await post('/api/review-link', {
    mapsUrl: 'not-a-url-at-all',
  });
  assert(status === 400, `Expected 400, got ${status}`);
  assert(!data.success, 'Expected success: false');
});

// 6. URL that is too long
await test('URL > 2048 chars returns 400', async () => {
  const { status, data } = await post('/api/review-link', {
    mapsUrl: 'https://maps.google.com/' + 'a'.repeat(2100),
  });
  assert(status === 400, `Expected 400, got ${status}`);
  assert(!data.success, 'Expected success: false');
});

// 7. Valid Google Maps URL (standard)
await test('Valid google.com/maps URL is accepted', async () => {
  const { status, data } = await post('/api/review-link', {
    mapsUrl:
      'https://www.google.com/maps/place/Eiffel+Tower/@48.8583701,2.2922926,17z',
  });
  // Should succeed or return a meaningful API error (not a validation 400)
  assert(
    status !== 400 || data.error?.includes('API') || data.error?.includes('key'),
    `Unexpected 400: ${data.error}`
  );
});

// 8. maps.app.goo.gl URL format accepted (SSRF check passes)
await test('maps.app.goo.gl URL passes SSRF whitelist check', async () => {
  const { data } = await post('/api/review-link', {
    mapsUrl: 'https://maps.app.goo.gl/testXYZ',
  });
  // This may fail at the resolve step if the URL is fake, but must NOT be rejected for domain
  assert(
    typeof data.error !== 'string' ||
      !data.error.includes('valid Google Maps link'),
    'Should not be rejected as invalid URL'
  );
});

// 9. /api/confirm-business with a valid Place ID
await test('confirm-business with valid placeId returns reviewUrl', async () => {
  const { status, data } = await post('/api/confirm-business', {
    placeId: 'ChIJtest1234567890',
    name: 'Test Business',
    address: '123 Test St',
  });
  assert(status === 200, `Expected 200, got ${status}`);
  assert(data.success, 'Expected success: true');
  assert(
    data.reviewUrl?.includes('ChIJtest1234567890'),
    'Expected placeId in reviewUrl'
  );
  assert(
    data.reviewUrl?.startsWith(
      'https://search.google.com/local/writereview?placeid='
    ),
    'Expected review URL format'
  );
});

// 10. /api/confirm-business with invalid/empty Place ID
await test('confirm-business with empty placeId returns 400', async () => {
  const { status, data } = await post('/api/confirm-business', {
    placeId: '',
  });
  assert(status === 400, `Expected 400, got ${status}`);
  assert(!data.success, 'Expected success: false');
});

// 11. /api/confirm-business with injection attempt in Place ID
await test('confirm-business rejects script-injected placeId', async () => {
  const { status, data } = await post('/api/confirm-business', {
    placeId: '<script>alert(1)</script>',
  });
  assert(status === 400, `Expected 400, got ${status}`);
  assert(!data.success, 'Expected success: false');
});

// ─────────────────────────────────────────────────────────────────────────────
//  Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n─────────────────────────────`);
console.log(`  Tests passed: ${passed}`);
console.log(`  Tests failed: ${failed}`);
console.log(`─────────────────────────────\n`);

if (failed > 0) process.exit(1);
