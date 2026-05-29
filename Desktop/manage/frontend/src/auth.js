const ADMIN_EMAIL = "muyizerenafsi@gmail.com";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem("user");
}

export function resolveRole(user) {
  if (!user) return null;
  if (user.email?.toLowerCase() === ADMIN_EMAIL) return "admin";
  return user.role === "admin" ? "admin" : "user";
}

export function isAdmin(user = getStoredUser()) {
  return resolveRole(user) === "admin";
}

export function isUser(user = getStoredUser()) {
  return resolveRole(user) === "user";
}

export function getDefaultPath(user = getStoredUser()) {
  return isAdmin(user) ? "/admin/monthly-report" : "/car";
}
