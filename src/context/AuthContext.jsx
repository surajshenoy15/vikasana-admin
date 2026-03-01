import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);

/**
 * ✅ API Strategy (works for both DEV + Vercel PROD)
 * - DEV: set VITE_API_URL in .env (recommended) or fallback to VPS IP
 * - PROD (Vercel): use same-origin "/api" so vercel.json rewrites can proxy to backend
 *
 * .env (local):
 * VITE_API_URL=http://31.97.230.171:8000
 */
const API_PREFIX = "/api";
const API_URL = import.meta.env.PROD
  ? "" // ✅ Vercel production -> use same origin + rewrites
  : import.meta.env.VITE_API_URL || "http://31.97.230.171:8000";

const API_BASE = `${API_URL}${API_PREFIX}`;

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  // ✅ Build URL safely for both:
  // - "/admin/events" -> `${API_BASE}/admin/events`
  // - "/api/admin/events" -> `${API_URL}/api/admin/events` (avoids /api/api)
  // - absolute "http(s)://..." -> as is
  const buildUrl = useCallback((path) => {
    if (!path || typeof path !== "string") return API_BASE;

    // If already absolute, use as-is
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    // If someone passes "/api/...." avoid "/api/api/...."
    // - PROD: API_URL="" => returns "/api/...."
    // - DEV: API_URL="http://.." => returns "http://../api/...."
    if (path.startsWith(API_PREFIX + "/")) return `${API_URL}${path}`;

    // Normal case: "/admin/events/1" => `${API_BASE}/admin/events/1`
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE}${normalizedPath}`;
  }, []);

  // ✅ authFetch:
  // - attaches token
  // - handles JSON vs FormData
  // - always uses buildUrl
  const authFetch = useCallback(
    async (path, options = {}) => {
      const token = sessionStorage.getItem("vf_token");
      const url = buildUrl(path);

      const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const isFormData = options.body instanceof FormData;
      const hasBody = typeof options.body !== "undefined" && options.body !== null;

      // Set JSON content-type only when sending a non-FormData body
      if (hasBody && !isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      // 🔎 Debug (remove later)
      console.log("[authFetch]", (options.method || "GET").toUpperCase(), url);

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [buildUrl]
  );

  // ✅ Restore session on refresh
  useEffect(() => {
    const token = sessionStorage.getItem("vf_token");
    if (!token) {
      setBootstrapping(false);
      return;
    }

    (async () => {
      try {
        const res = await authFetch("/auth/me", { method: "GET" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          sessionStorage.removeItem("vf_token");
          setAdmin(null);
        } else {
          setAdmin(data);
        }
      } catch {
        setAdmin(null);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [authFetch]);

  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { success: false, message: data.detail ?? "Login failed. Please try again." };
      }

      if (!data.access_token) {
        return { success: false, message: "No access token received from server." };
      }

      sessionStorage.setItem("vf_token", data.access_token);

      // ✅ get admin profile
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      const me = await meRes.json().catch(() => ({}));

      if (!meRes.ok) {
        sessionStorage.removeItem("vf_token");
        return { success: false, message: me.detail ?? "Unable to fetch admin profile." };
      }

      setAdmin(me);
      return { success: true };
    } catch {
      return { success: false, message: "Cannot reach server. Check your connection." };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = sessionStorage.getItem("vf_token");

    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    sessionStorage.removeItem("vf_token");
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        login,
        logout,
        authFetch,
        isAuthenticated: !!admin,
        bootstrapping,
        API_BASE, // optional export for debugging/use
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};