import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock environment variables
process.env.NCB_INSTANCE = '36905_ai_smb_crm';
process.env.NCB_AUTH_API_URL = 'https://app.nocodebackend.com/api/user-auth';
process.env.NCB_DATA_API_URL = 'https://app.nocodebackend.com/api/data';
process.env.OPENAI_API_KEY = 'test-api-key';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Reset fetch mock between tests
beforeEach(() => {
  vi.restoreAllMocks();
  localStorageMock.clear();
});
