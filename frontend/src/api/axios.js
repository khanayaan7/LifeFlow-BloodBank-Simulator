import axios from "axios";

function resolveApiBaseUrl() {
  const envUrl = process.env.REACT_APP_API_URL;
  const isBrowser = typeof window !== "undefined";

  if (!isBrowser) {
    return envUrl || "http://localhost:8000";
  }

  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;

  // If the build still has localhost baked in but app is opened on another host,
  // automatically target backend on the same host at port 8000.
  if (envUrl) {
    const isLocalEnvUrl = envUrl.includes("localhost") || envUrl.includes("127.0.0.1");
    const isRemoteHost = currentHost !== "localhost" && currentHost !== "127.0.0.1";

    if (!(isLocalEnvUrl && isRemoteHost)) {
      return envUrl;
    }
  }

  return `${currentProtocol}//${currentHost}:8000`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl()
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
