import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getDefaultPath, resolveRole, setStoredUser } from "./auth";

const ADMIN_EMAIL = "muyizerenafsi@gmail.com";

export default function Signin() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginRole, setLoginRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isLogin
      ? "http://localhost:5000/api/auth/signin"
      : "http://localhost:5000/api/auth/signup";

    const payload = isLogin
      ? { email: form.email, password: form.password, role: loginRole }
      : { name: form.name, email: form.email, password: form.password, role: form.role };

    try {
      const res = await axios.post(url, payload);

      if (isLogin && res?.data?.user) {
        const user = res.data.user;
        const actualRole = resolveRole(user);

        if (actualRole !== loginRole) {
          setError(
            loginRole === "admin"
              ? "This account is not an admin. Use User role or sign in with the admin email."
              : "This account is an admin. Select Admin role to continue."
          );
          setLoading(false);
          return;
        }

        setStoredUser(user);
        navigate(getDefaultPath(user));
      } else if (!isLogin && res?.data?.message) {
        setError("");
        alert(res.data.message);
        setIsLogin(true);
      } else {
        setError(res?.data?.message || "Something went wrong.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-indigo-700">
            {isLogin ? "Welcome back" : "Create your account"}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {isLogin ? "Login" : "Register"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isLogin
              ? "Choose your role, then sign in."
              : "Register as a user or admin."}
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Login as</p>
              <div className="grid grid-cols-2 gap-2">
                <RoleButton
                  active={loginRole === "user"}
                  label="User"
                  description="Car, services, records"
                  onClick={() => setLoginRole("user")}
                />
                <RoleButton
                  active={loginRole === "admin"}
                  label="Admin"
                  description="Reports & invoices"
                  onClick={() => setLoginRole("admin")}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="role">
                Account role
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 placeholder:text-slate-400 focus:ring-2"
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 placeholder:text-slate-400 focus:ring-2"
              placeholder={isLogin && loginRole === "admin" ? ADMIN_EMAIL : "Enter your email"}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
                ? `Login as ${loginRole === "admin" ? "Admin" : "User"}`
                : "Signup"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-600">
          <button
            type="button"
            className="font-semibold text-indigo-700 hover:text-indigo-800"
            onClick={() => setIsLogin((v) => !v)}
          >
            {isLogin ? "No account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleButton({ active, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
        active
          ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span className="block font-semibold text-slate-900">{label}</span>
      <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
    </button>
  );
}
