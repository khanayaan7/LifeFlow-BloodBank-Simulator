import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Droplet, Eye, EyeOff, UserPlus } from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const QUICK_LOGIN_ACCOUNTS = [
  { label: "Bank More Admin", email: "admin.bankmore@lifeflow.com", password: "BankMoreAdmin@1234" },
  { label: "Bank More Lab", email: "lab.bankmore@lifeflow.com", password: "BankMoreLab@1234" },
  { label: "Bank More Auditor", email: "auditor.bankmore@lifeflow.com", password: "BankMoreAudit@1234" },
  { label: "City Center Admin", email: "admin.citycenter@lifeflow.com", password: "CityCenterAdmin@1234" },
  { label: "City Center Lab", email: "lab.citycenter@lifeflow.com", password: "CityCenterLab@1234" },
  { label: "City Center Auditor", email: "auditor.citycenter@lifeflow.com", password: "CityCenterAudit@1234" },
  { label: "Asarfi Staff", email: "staff.asarfi@dhanbad.com", password: "Asarfi@1234" },
  { label: "PMCH Staff", email: "staff.pmch@dhanbad.com", password: "PMCH@1234" },
  { label: "Jalan Staff", email: "staff.jalan@dhanbad.com", password: "Jalan@1234" },
  { label: "Seed Donor Riya", email: "donor.riya@lifeflow.com", password: "RiyaDonor@1234" },
  { label: "Seed Donor Arjun", email: "donor.arjun@lifeflow.com", password: "ArjunDonor@1234" }
];

function defaultRouteForRole(role) {
  if (role === "hospital_staff") return "/requests";
  if (role === "donor") return "/donor";
  return "/";
}

export default function Login() {
  const [mode, setMode] = useState("login");
  const [quickLoginsOpen, setQuickLoginsOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registrationForm, setRegistrationForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  const [showRegistrationConfirm, setShowRegistrationConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const applyQuickLogin = (account) => {
    setMode("login");
    setLoginForm({ email: account.email, password: account.password });
    setShowPassword(false);
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const form = new URLSearchParams();
      form.append("username", loginForm.email);
      form.append("password", loginForm.password);
      const { data } = await api.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      login(data.access_token, data.user);
      navigate(defaultRouteForRole(data?.user?.role));
      toast.success("Login successful");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    if (registrationForm.password !== registrationForm.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        full_name: registrationForm.full_name.trim(),
        email: registrationForm.email.trim(),
        phone_number: registrationForm.phone_number.trim(),
        password: registrationForm.password
      };
      const { data } = await api.post("/auth/register/donor", payload);
      login(data.access_token, data.user);
      navigate("/donor");
      toast.success("Donor account created");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 dark:bg-gray-950"
      style={{
        backgroundImage:
          "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1200 800\"><defs><linearGradient id=\"grad1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" style=\"stop-color:%23fff5f5;stop-opacity:1\" /><stop offset=\"100%\" style=\"stop-color:%23ffe0e0;stop-opacity:1\" /></linearGradient></defs><rect width=\"1200\" height=\"800\" fill=\"url(%23grad1)\"/><circle cx=\"150\" cy=\"100\" r=\"200\" fill=\"%23ffb3b3\" opacity=\"0.3\"/><circle cx=\"1050\" cy=\"700\" r=\"250\" fill=\"%23ff8787\" opacity=\"0.2\"/><circle cx=\"600\" cy=\"400\" r=\"100\" fill=\"%23ff6b6b\" opacity=\"0.1\"/></svg>')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="absolute right-0 top-0 h-96 w-96 -mr-48 -mt-48 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 h-96 w-96 -mb-48 -ml-48 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl" />

      <aside
        className={`fixed left-2 top-1/2 z-20 -translate-y-1/2 transition-all duration-300 ${quickLoginsOpen ? "w-72" : "w-14"}`}
      >
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-white/90 shadow-xl backdrop-blur-md dark:bg-gray-900/90">
          <button
            type="button"
            onClick={() => setQuickLoginsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-3 py-3 text-left text-label-md font-semibold text-on-surface transition-colors hover:bg-primary/5 dark:text-gray-100"
          >
            <span className={quickLoginsOpen ? "" : "[writing-mode:vertical-rl] mx-auto rotate-180"}>Quick Logins</span>
            {quickLoginsOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {quickLoginsOpen && (
            <div className="px-3 pb-3">
              <p className="mb-2 text-xs text-on-surface-variant dark:text-gray-400">Auto-fill a demo account to inspect each role.</p>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_LOGIN_ACCOUNTS.map((account) => (
                  <button
                    key={account.label}
                    type="button"
                    onClick={() => applyQuickLogin(account)}
                    className="group rounded-lg border border-primary/20 bg-gradient-to-r from-white to-primary/5 px-3 py-2 text-left text-label-md font-semibold text-on-surface transition-all hover:border-primary/50 hover:text-primary dark:from-gray-800 dark:to-primary/20 dark:text-gray-100"
                  >
                    <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">{account.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Droplet className="h-10 w-10 fill-primary text-primary" />
            <h1 className="font-display text-5xl font-bold text-primary">LifeFlow</h1>
          </div>
          <p className="text-body-md text-on-surface-variant dark:text-gray-400">Vital Management Portal</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] bg-white/82 p-8 shadow-2xl backdrop-blur-md dark:bg-gray-800/80">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  mode === "login"
                    ? "bg-gradient-to-r from-primary to-primary-container text-white"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  mode === "register"
                    ? "bg-gradient-to-r from-primary to-primary-container text-white"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                Donor Registration
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={submitLogin} className="mt-8 space-y-6">
                <div>
                  <label className="mb-2 block text-label-md font-semibold text-on-surface dark:text-gray-300">EMAIL</label>
                  <input
                    required
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low px-4 py-3 text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:from-gray-700 dark:to-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-offset-gray-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-label-md font-semibold text-on-surface dark:text-gray-300">PASSWORD</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                      className="w-full rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low px-4 py-3 pr-10 text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:from-gray-700 dark:to-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-offset-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary dark:text-gray-500 dark:hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-8 w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-3 font-semibold text-on-primary transition-all duration-200 hover:shadow-lg hover:shadow-primary/40 disabled:opacity-70"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : (
              <form onSubmit={submitRegistration} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-label-md font-semibold text-on-surface dark:text-gray-300">FULL NAME</label>
                  <input
                    required
                    type="text"
                    value={registrationForm.full_name}
                    onChange={(event) => setRegistrationForm((prev) => ({ ...prev, full_name: event.target.value }))}
                    className="w-full rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low px-4 py-3 text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:from-gray-700 dark:to-gray-700 dark:text-gray-200 dark:focus:ring-offset-gray-800"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-label-md font-semibold text-on-surface dark:text-gray-300">EMAIL</label>
                    <input
                      required
                      type="email"
                      value={registrationForm.email}
                      onChange={(event) => setRegistrationForm((prev) => ({ ...prev, email: event.target.value }))}
                      className="w-full rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low px-4 py-3 text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:from-gray-700 dark:to-gray-700 dark:text-gray-200 dark:focus:ring-offset-gray-800"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-label-md font-semibold text-on-surface dark:text-gray-300">PHONE NUMBER</label>
                    <input
                      required
                      type="text"
                      value={registrationForm.phone_number}
                      onChange={(event) => setRegistrationForm((prev) => ({ ...prev, phone_number: event.target.value }))}
                      className="w-full rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low px-4 py-3 text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:from-gray-700 dark:to-gray-700 dark:text-gray-200 dark:focus:ring-offset-gray-800"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-label-md font-semibold text-on-surface dark:text-gray-300">PASSWORD</label>
                    <div className="relative">
                      <input
                        required
                        type={showRegistrationPassword ? "text" : "password"}
                        value={registrationForm.password}
                        onChange={(event) => setRegistrationForm((prev) => ({ ...prev, password: event.target.value }))}
                        className="w-full rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low px-4 py-3 pr-10 text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:from-gray-700 dark:to-gray-700 dark:text-gray-200 dark:focus:ring-offset-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegistrationPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary dark:text-gray-500 dark:hover:text-primary"
                      >
                        {showRegistrationPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-label-md font-semibold text-on-surface dark:text-gray-300">CONFIRM PASSWORD</label>
                    <div className="relative">
                      <input
                        required
                        type={showRegistrationConfirm ? "text" : "password"}
                        value={registrationForm.confirm_password}
                        onChange={(event) => setRegistrationForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
                        className="w-full rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low px-4 py-3 pr-10 text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:from-gray-700 dark:to-gray-700 dark:text-gray-200 dark:focus:ring-offset-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegistrationConfirm((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary dark:text-gray-500 dark:hover:text-primary"
                      >
                        {showRegistrationConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container py-3 font-semibold text-on-primary transition-all duration-200 hover:shadow-lg hover:shadow-primary/40 disabled:opacity-70"
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? "Creating account..." : "Create Donor Account"}
                </button>
              </form>
            )}

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/20" />
              <p className="text-label-md text-on-surface-variant">Secure Access</p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/20" />
            </div>
          </section>

          <section className="rounded-[32px] bg-surface/90 p-8 shadow-2xl backdrop-blur-md dark:bg-gray-900/90">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Donor Experience</p>
            <h2 className="mt-4 font-display text-3xl font-bold text-on-surface dark:text-white">
              Self-registration now creates a real donor identity
            </h2>
            <div className="mt-6 space-y-4 text-body-md text-on-surface-variant dark:text-gray-400">
              <p>Your donor account gets a unique donor ID that stays linked to your donation records.</p>
              <p>Once staff record a donation, your dashboard shows the receipt, blood bank branch, and whether that unit has been allocated.</p>
              <p>If a donation is allocated, the dashboard also shows the hospital name, patient name, and patient ID tied to that request.</p>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl bg-surface-container-low p-5 dark:bg-gray-800">
                <p className="text-sm font-semibold text-on-surface dark:text-white">Seed Donor Login</p>
                <p className="mt-2 text-sm text-on-surface-variant dark:text-gray-400">Use Quick Logins for `Seed Donor Riya` or `Seed Donor Arjun` to inspect the new donor dashboard immediately.</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-5 dark:bg-gray-800">
                <p className="text-sm font-semibold text-on-surface dark:text-white">Branch-aware receipts</p>
                <p className="mt-2 text-sm text-on-surface-variant dark:text-gray-400">Receipts now show whether the donation was recorded at City Center or Bank More, along with the allocation outcome.</p>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-8 text-center text-label-md text-on-surface-variant">© 2026 LifeFlow. All rights reserved.</p>
      </div>
    </div>
  );
}
