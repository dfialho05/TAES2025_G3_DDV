/**
 * Simple helper for Auth API calls (arrow-function version with comments).
 *
 * Endpoints assumed (based on TAES project routes):
 *  - POST /api/register        -> register new user
 *  - POST /api/login           -> login (returns token)
 *  - POST /api/logout          -> logout (requires Authorization: Bearer <token>)
 *  - GET  /api/users/me        -> get authenticated user profile
 *  - PUT  /api/users/me        -> update profile
 *  - PATCH/PUT /api/users/me   -> update profile (PATCH is supported too)
 *  - DELETE /api/users/me      -> delete account (requires { current_password })
 *
 * This module:
 *  - uses fetch
 *  - stores token in localStorage key 'auth_token'
 *  - exposes convenience functions for register/login/logout/profile/update/delete
 *
 * Usage:
 *  import authApi from './authApi';
 *  await authApi.register({ name, email, password, nickname });
 *  await authApi.login(email, password);
 *  const me = await authApi.getProfile();
 *
 * Note:
 *  - This is a thin client wrapper. You can adapt token storage (e.g. cookies) if needed.
 *  - All functions throw an Error with `.response` (the parsed JSON response) for non-OK responses.
 */

const DEFAULT_BASE = "/api";
let BASE_URL = DEFAULT_BASE;
const TOKEN_KEY = "auth_token";

/* ---- Helpers ---- */

// setBaseUrl: sets the base API url used by the helper.
// Trims trailing slashes so calls are consistent.
// Usage: authApi.setBaseUrl('https://example.com/api')
const setBaseUrl = (url) => {
    BASE_URL = url.replace(/\/+$/, ""); // strip trailing slash
};

// saveToken: persist token to localStorage under TOKEN_KEY.
// Called after successful login/register.
const saveToken = (token) => {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
};

// getToken: read token from localStorage.
// Used internally to build Authorization headers.
const getToken = () => localStorage.getItem(TOKEN_KEY);

// clearToken: remove token from storage (used on logout or account deletion).
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// getAuthHeaders: build Authorization header when token exists.
// Returns an object suitable for merging into fetch headers.
const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// parseResponse: centralised response parsing and error handling.
// - If response has JSON content-type, parse JSON.
// - If response is not ok, throw an Error that contains `status` and `response`.
const parseResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    let body = null;
    if (contentType.includes("application/json")) {
        body = await res.json();
    } else {
        body = await res.text();
    }
    if (!res.ok) {
        const err = new Error(`HTTP ${res.status} ${res.statusText}`);
        err.status = res.status;
        err.response = body;
        throw err;
    }
    return body;
};

/* ---- API calls ---- */

/**
 * register:
 * - Creates a new user by calling POST /api/register with JSON payload.
 * - Expects backend to return { token, user } on success.
 * - Stores token in localStorage if provided.
 *
 * Input: data { name, email, password, nickname?, photo_avatar_filename? }
 * Output: parsed response object from server (often contains token + user)
 */
const register = async (data = {}) => {
    const url = `${BASE_URL}/register`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const body = await parseResponse(res);

    // If backend returns token, store it for subsequent requests
    if (body && body.token) {
        saveToken(body.token);
    }

    return body;
};

/**
 * login:
 * - Authenticates the user by POST /api/login with { email, password }.
 * - On success backend returns a token (and maybe user info).
 * - Token is saved to localStorage for further authenticated requests.
 *
 * Input: email, password
 * Output: parsed response (should contain token)
 */
const login = async (email, password) => {
    const url = `${BASE_URL}/login`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    const body = await parseResponse(res);

    if (body && body.token) {
        saveToken(body.token);
    }

    return body;
};

/**
 * logout:
 * - Calls POST /api/logout to revoke the current token server-side.
 * - Clears the token locally regardless of server response.
 *
 * Output: parsed server response (e.g., { message: 'Logged out successfully' })
 */
const logout = async () => {
    const url = `${BASE_URL}/logout`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    const body = await parseResponse(res);

    // clear local token regardless of result (defensive)
    clearToken();
    return body;
};

/**
 * getProfile:
 * - Fetches authenticated user's profile from GET /api/users/me.
 * - Requires Authorization header (managed automatically from stored token).
 *
 * Output: user object
 */
const getProfile = async () => {
    const url = `${BASE_URL}/users/me`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    return parseResponse(res);
};

/**
 * updateProfile:
 * - Updates authenticated user's profile by PUT /api/users/me (server accepts PATCH/PUT).
 * - If changing password, be sure to include current_password per API requirements.
 *
 * Input: data object with fields to update.
 * Output: updated user object from server.
 */
const updateProfile = async (data = {}) => {
    const url = `${BASE_URL}/users/me`;
    const res = await fetch(url, {
        method: "PUT", // server accepts PUT/PATCH
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
    });

    return parseResponse(res);
};

/**
 * deleteAccount:
 * - Deletes the authenticated user's account by calling DELETE /api/users/me with { current_password }.
 * - On success clears local token (user is no longer authenticated).
 *
 * Input: current_password (string)
 * Output: server response (e.g., { message: 'Account deleted successfully.' })
 */
const deleteAccount = async (current_password) => {
    const url = `${BASE_URL}/users/me`;
    const res = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ current_password }),
    });

    const body = await parseResponse(res);

    // If delete succeeded, clear local token
    clearToken();
    return body;
};

/* ---- Utilities ---- */

// isAuthenticated: simple check for presence of a stored token.
// Note: token presence does not guarantee server-side validity.
const isAuthenticated = () => !!getToken();

// getStoredToken: return the token string from storage (if any).
const getStoredToken = () => getToken();

// setTokenManually: allow overriding the token (e.g., from server/session).
const setTokenManually = (token) => saveToken(token);

/* ---- Exports ---- */
const authApi = {
    setBaseUrl,
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    deleteAccount,
    isAuthenticated,
    getStoredToken,
    setTokenManually,
};

export default authApi;
