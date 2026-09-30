const ACCESS_TOKEN_KEY = 'lc_access_token';
const REFRESH_TOKEN_KEY = 'lc_refresh_token';

// localStorage, not httpOnly cookies: the backend is a plain REST/WS API
// consumed identically by this web app and the native mobile apps (TT
// §2.5), so the token model has to work the same way on all three —
// cookies tied to a browser origin don't fit that.
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
