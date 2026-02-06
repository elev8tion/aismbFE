import '@testing-library/jest-dom';

// Polyfills for crypto.randomUUID used in components
// happy-dom provides crypto.subtle but not randomUUID by default
if (!('randomUUID' in crypto)) {
  // @ts-ignore
  crypto.randomUUID = () => '00000000-0000-4000-8000-000000000000';
}

