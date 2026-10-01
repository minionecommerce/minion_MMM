// Use these instead of `user: true` so password hashes and security fields
// never leave the server (server components serialize props to the browser).
export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  roleId: true,
  status: true,
} as const;
