import { isPlatformAdminAttributes } from './adminUtils';

describe('isPlatformAdminAttributes', () => {
  test('allows configured default admin email', () => {
    expect(isPlatformAdminAttributes({ email: 'nathaniel.mckinnon@gmail.com' })).toBe(true);
  });

  test('allows configured default admin subject', () => {
    expect(isPlatformAdminAttributes({ sub: '6448a458-b051-70f6-20e9-e367f821288c' })).toBe(true);
  });

  test('rejects missing or unrecognized identity attributes', () => {
    expect(isPlatformAdminAttributes({ email: 'soldier@example.com', sub: 'unknown' })).toBe(false);
    expect(isPlatformAdminAttributes(null)).toBe(false);
  });
});
