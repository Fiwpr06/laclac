import { sanitizeUserData } from './auth.service';

describe('AuthService helpers', () => {
  it('should remove sensitive fields from user object', () => {
    const input = {
      _id: '1',
      email: 'user@example.com',
      passwordHash: 'secret',
      refreshTokenHash: 'refresh-secret',
      __v: 0,
    };

    const result = sanitizeUserData(input);

    expect(result).toEqual({
      _id: '1',
      email: 'user@example.com',
    });
  });
});
