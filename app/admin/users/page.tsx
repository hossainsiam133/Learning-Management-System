"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { getStrapiApiUrl } from "@/app/lib/strapiClient";
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

const ROLE_OPTIONS = ["Admin", "Content Manager", "Instructor"] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

interface UserRecord {
  id: number;
  username?: string;
  email?: string;
  confirmed?: boolean;
  blocked?: boolean;
  provider?: string;
  role?: {
    id?: number;
    name?: string;
  } | null;
}

interface UserFormState {
  username: string;
  email: string;
  password: string;
  confirmed: boolean;
  blocked: boolean;
  role: RoleOption;
}

const emptyForm: UserFormState = {
  username: "",
  email: "",
  password: "",
  confirmed: true,
  blocked: false,
  role: "Admin",
};

const AdminUsersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: number; name: string }>>(
    [],
  );

  const getAuthToken = () => {
    const userDataCookie = Cookies.get("userData");

    if (!userDataCookie) {
      return null;
    }

    try {
      const parsed = JSON.parse(userDataCookie) as { authToken?: string };
      return parsed.authToken ?? null;
    } catch {
      Cookies.remove("userData");
      return null;
    }
  };

  const fetchRoles = async (token: string) => {
    try {
      const response = await fetch(getStrapiApiUrl("/users-permissions/roles"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => null);
      const roles = Array.isArray(payload?.roles)
        ? payload.roles
        : Array.isArray(payload)
          ? payload
          : [];

      const formattedRoles = roles
        .map((role: { id?: number | string; name?: string }) => ({
          id: Number(role.id),
          name: String(role.name ?? ""),
        }))
        .filter((role: { id: number; name: string }) => role.id && role.name);

      setAvailableRoles(formattedRoles);
    } catch {
      setAvailableRoles([]);
    }
  };

  const fetchUsers = async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(getStrapiApiUrl("/users?populate=role"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message ?? "Failed to load users.");
      }

      const data = (await response.json()) as UserRecord[];
      setUsers(data);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Failed to load users.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    const userDataCookie = Cookies.get("userData");
    const parsedUserData = userDataCookie
      ? (JSON.parse(userDataCookie) as { roleName?: string })
      : null;
    const roleName = parsedUserData?.roleName;

    if (!token) {
      router.push("/login");
      return;
    }

    if (roleName === "Instructor" || roleName === "Content Manager") {
      router.replace("/admin");
      return;
    }

    fetchRoles(token);
    fetchUsers(token);
  }, [router]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const resolveRoleId = (roleName: RoleOption) => {
    const selectedRole = availableRoles.find((role) => role.name === roleName);
    return selectedRole?.id ?? null;
  };

  const handleFieldChange = <K extends keyof UserFormState>(
    field: K,
    value: UserFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();

    const token = getAuthToken();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!form.username || !form.email || !form.password) {
      setError("Username, email, and password are required.");
      setSuccess("");
      return;
    }

    const selectedRoleId = resolveRoleId(form.role);

    if (!selectedRoleId) {
      setError("Selected role is not available. Please refresh and try again.");
      setSuccess("");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(getStrapiApiUrl("/users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          confirmed: form.confirmed,
          blocked: form.blocked,
          role: selectedRoleId,
        }),
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "User creation failed.");
      }

      setSuccess("User created successfully.");
      resetForm();
      await fetchUsers(token);
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "User creation failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const selectedRoleId = resolveRoleId(form.role);

    if (!selectedRoleId) {
      setError("Selected role is not available. Please refresh and try again.");
      setSuccess("");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload: Record<string, unknown> = {
        username: form.username,
        email: form.email,
        confirmed: form.confirmed,
        blocked: form.blocked,
        role: selectedRoleId,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const response = await fetch(getStrapiApiUrl(`/users/${editingId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(result?.error?.message ?? "User update failed.");
      }

      setSuccess("User updated successfully.");
      resetForm();
      await fetchUsers(token);
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "User update failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    const token = getAuthToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this user?");

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(getStrapiApiUrl(`/users/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message ?? "User deletion failed.");
      }

      setSuccess("User deleted successfully.");
      setUsers((prev) => prev.filter((user) => user.id !== id));

      if (editingId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "User deletion failed.",
      );
    }
  };

  const startEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setError("");
    setSuccess("");
    const roleName = user.role?.name ?? "Admin";
    setForm({
      username: user.username ?? "",
      email: user.email ?? "",
      password: "",
      confirmed: Boolean(user.confirmed),
      blocked: Boolean(user.blocked),
      role: ROLE_OPTIONS.includes(roleName as RoleOption)
        ? (roleName as RoleOption)
        : "Admin",
    });
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 0" }}>
      <Typography variant="h4" gutterBottom>
        Admin Users
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {editingId ? `Edit User #${editingId}` : "Create New User"}
        </Typography>

        <form onSubmit={editingId ? handleUpdateUser : handleCreateUser}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Username"
              value={form.username}
              onChange={(event) => handleFieldChange("username", event.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => handleFieldChange("email", event.target.value)}
              fullWidth
            />
            <TextField
              label={editingId ? "New Password (optional)" : "Password"}
              type="password"
              value={form.password}
              onChange={(event) => handleFieldChange("password", event.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                value={form.role}
                label="Role"
                onChange={(event) =>
                  handleFieldChange("role", event.target.value as RoleOption)
                }
              >
                {ROLE_OPTIONS.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="confirmed-label">Confirmed</InputLabel>
              <Select
                labelId="confirmed-label"
                value={form.confirmed ? "yes" : "no"}
                label="Confirmed"
                onChange={(event) =>
                  handleFieldChange("confirmed", event.target.value === "yes")
                }
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="blocked-label">Blocked</InputLabel>
              <Select
                labelId="blocked-label"
                value={form.blocked ? "yes" : "no"}
                label="Blocked"
                onChange={(event) => handleFieldChange("blocked", event.target.value === "yes")}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update User" : "Create User"}
            </Button>

            {editingId && (
              <Button variant="outlined" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </Stack>
        </form>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Users List
        </Typography>

        {loading ? (
          <Stack sx={{ alignItems: "center", py: 3 }}>
            <CircularProgress />
          </Stack>
        ) : users.length === 0 ? (
          <Typography>No users found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Confirmed</TableCell>
                  <TableCell>Blocked</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username || "-"}</TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>{user.confirmed ? "Yes" : "No"}</TableCell>
                    <TableCell>{user.blocked ? "Yes" : "No"}</TableCell>
                    <TableCell>{user.role?.name || "-"}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => startEdit(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </div>
  );
};

export default AdminUsersPage;