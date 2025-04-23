// Mock Sentry to avoid actual reporting during tests
import { vi } from 'vitest';

vi.mock('@sentry/browser', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// Mock fetch if not provided by the test environment
if (!global.fetch) {
  global.fetch = vi.fn();
}