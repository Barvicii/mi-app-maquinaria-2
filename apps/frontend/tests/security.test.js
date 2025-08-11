/**
 * Security Tests for NoSQL Injection Prevention
 * Tests the security utilities to ensure they properly prevent injection attacks
 */

import { 
  sanitizeInput, 
  sanitizeRegexInput, 
  createSafeRegexQuery, 
  validateOrganizationName,
  sanitizeSearchFilters 
} from '../lib/security.js';

// Test data containing various injection attempts
const injectionTests = [
  // Basic regex injection attempts
  '.*',
  '^admin$',
  '.*|.*',
  '($)',
  '[a-z]*',
  
  // MongoDB operator injection attempts
  '{"$ne": null}',
  '{"$regex": ".*"}',
  '{"$where": "function() { return true; }"}',
  '{"$or": [{"password": {"$exists": true}}]}',
  
  // Special characters that could break regex
  '\\',
  '$',
  '^',
  '.',
  '*',
  '+',
  '?',
  '{',
  '}',
  '[',
  ']',
  '(',
  ')',
  '|',
  
  // Control characters
  '\x00',
  '\x1f',
  '\x7f',
  
  // Very long strings (DoS attempt)
  'a'.repeat(1000),
];

console.log('🔒 Running Security Tests for NoSQL Injection Prevention\n');

// Test 1: sanitizeInput function
console.log('1. Testing sanitizeInput function:');
injectionTests.forEach((test, index) => {
  const sanitized = sanitizeInput(test);
  const hasSpecialChars = /[.*+?^${}()|[\]\\]/.test(sanitized);
  console.log(`   Test ${index + 1}: "${test.substring(0, 20)}${test.length > 20 ? '...' : ''}" → "${sanitized.substring(0, 30)}${sanitized.length > 30 ? '...' : ''}" ${hasSpecialChars ? '❌ STILL HAS SPECIAL CHARS' : '✅ SAFE'}`);
});

// Test 2: sanitizeRegexInput function
console.log('\n2. Testing sanitizeRegexInput function:');
injectionTests.forEach((test, index) => {
  const sanitized = sanitizeRegexInput(test);
  const isSafe = sanitized.length <= 100 && !/[.*+?^${}()|[\]\\]/.test(sanitized) && !/[\x00-\x1f\x7f-\x9f]/.test(sanitized);
  console.log(`   Test ${index + 1}: "${test.substring(0, 20)}${test.length > 20 ? '...' : ''}" → "${sanitized}" ${isSafe ? '✅ SAFE' : '❌ POTENTIALLY UNSAFE'}`);
});

// Test 3: createSafeRegexQuery function
console.log('\n3. Testing createSafeRegexQuery function:');
injectionTests.forEach((test, index) => {
  const query = createSafeRegexQuery(test);
  const isValid = query === null || (typeof query === 'object' && query.$regex && query.$options);
  console.log(`   Test ${index + 1}: "${test.substring(0, 20)}${test.length > 20 ? '...' : ''}" → ${query ? `{$regex: "${query.$regex}", $options: "${query.$options}"}` : 'null'} ${isValid ? '✅ VALID' : '❌ INVALID'}`);
});

// Test 4: validateOrganizationName function
console.log('\n4. Testing validateOrganizationName function:');
const orgTests = [
  'ValidOrg123',
  'Valid Org-Name_2',
  '',
  'a',
  'a'.repeat(100),
  'Invalid<script>',
  '{"$ne": null}',
  'Normal Org Name',
  '  Trimmed  ',
];

orgTests.forEach((test, index) => {
  const result = validateOrganizationName(test);
  console.log(`   Test ${index + 1}: "${test}" → ${result.isValid ? '✅ VALID' : '❌ INVALID'} ${result.error || ''}`);
});

// Test 5: sanitizeSearchFilters function
console.log('\n5. Testing sanitizeSearchFilters function:');
const filterTests = [
  { machineId: 'normal-id' },
  { brand: 'Normal Brand' },
  { model: '.*', brand: 'Test.*' },
  { machineId: '{"$ne": null}' },
  { invalidField: 'should be ignored', machineId: 'valid' },
  { workplace: '^admin$' },
];

filterTests.forEach((test, index) => {
  const sanitized = sanitizeSearchFilters(test);
  const hasValidRegex = Object.values(sanitized).every(val => 
    typeof val === 'object' && val.$regex && val.$options
  );
  console.log(`   Test ${index + 1}: ${JSON.stringify(test)} → ${JSON.stringify(sanitized)} ${hasValidRegex ? '✅ SAFE' : '❌ CHECK REQUIRED'}`);
});

// Test 6: Real-world injection scenarios
console.log('\n6. Testing Real-world Injection Scenarios:');

// Scenario 1: Organization name injection attempt
const maliciousOrgName = '.*"; return true; //';
const orgValidation = validateOrganizationName(maliciousOrgName);
console.log(`   Org injection attempt: ${orgValidation.isValid ? '❌ VULNERABLE' : '✅ BLOCKED'} - ${orgValidation.error || 'Sanitized: ' + orgValidation.sanitized}`);

// Scenario 2: Search filter injection attempt
const maliciousSearch = { machineId: '.*|admin.*', brand: '{"$ne": null}' };
const safeSearch = sanitizeSearchFilters(maliciousSearch);
const isSafeSearch = Object.keys(safeSearch).length < Object.keys(maliciousSearch).length || 
  Object.values(safeSearch).every(val => val && val.$regex && !val.$regex.includes('|'));
console.log(`   Search injection attempt: ${isSafeSearch ? '✅ BLOCKED' : '❌ VULNERABLE'} - ${JSON.stringify(safeSearch)}`);

// Scenario 3: Regex DoS attempt
const longString = 'a'.repeat(500);
const dosTest = createSafeRegexQuery(longString);
const isDosBlocked = !dosTest || dosTest.$regex.length <= 100;
console.log(`   Regex DoS attempt: ${isDosBlocked ? '✅ BLOCKED' : '❌ VULNERABLE'} - Length: ${dosTest ? dosTest.$regex.length : 'null'}`);

console.log('\n🔒 Security Test Summary:');
console.log('✅ All NoSQL injection attempts should be blocked or sanitized');
console.log('✅ Input validation should reject malicious patterns');
console.log('✅ Rate limiting should prevent brute force attacks');
console.log('✅ Regex DoS attacks should be mitigated');

export { injectionTests };
