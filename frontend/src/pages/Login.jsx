import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Droplet } from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const { data } = await api.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      login(data.access_token, data.user);
      navigate("/");
      toast.success("Login successful");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden dark:bg-gray-950"
      style={{
        backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1200 800\"><defs><linearGradient id=\"grad1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" style=\"stop-color:%23fff5f5;stop-opacity:1\" /><stop offset=\"100%\" style=\"stop-color:%23ffe0e0;stop-opacity:1\" /></linearGradient></defs><rect width=\"1200\" height=\"800\" fill=\"url(%23grad1)\"/><circle cx=\"150\" cy=\"100\" r=\"200\" fill=\"%23ffb3b3\" opacity=\"0.3\"/><circle cx=\"1050\" cy=\"700\" r=\"250\" fill=\"%23ff8787\" opacity=\"0.2\"/><circle cx=\"600\" cy=\"400\" r=\"100\" fill=\"%23ff6b6b\" opacity=\"0.1\"/></svg>')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl -ml-48 -mb-48"></div>

      <div className="relative w-full max-w-md z-10">
        {/* Project Name with Icon */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Droplet className="h-10 w-10 text-primary fill-primary" />
            <h1 className="font-display text-5xl font-bold text-primary">LifeFlow</h1>
          </div>
          <p className="text-body-md text-on-surface-variant dark:text-gray-400">Vital Management Portal</p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-10 shadow-2xl border border-primary/10 dark:border-primary/20">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-label-md font-semibold text-on-surface dark:text-gray-300 mb-2">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low dark:from-gray-700 dark:to-gray-700 dark:text-gray-200 dark:placeholder-gray-500 px-4 py-3 text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-label-md font-semibold text-on-surface dark:text-gray-300 mb-2">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  
                  className="w-full rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low dark:from-gray-700 dark:to-gray-700 dark:text-gray-200 dark:placeholder-gray-500 px-4 py-3 pr-10 text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-3 font-semibold text-on-primary hover:shadow-lg hover:shadow-primary/40 transition-all duration-200 disabled:opacity-70 mt-8"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Decorative divider */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/20"></div>
            <p className="text-label-md text-on-surface-variant">Secure Login</p>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/20"></div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-label-md text-on-surface-variant mt-8">
          © 2026 LifeFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
}
