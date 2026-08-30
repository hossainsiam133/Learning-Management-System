"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
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

interface LessonRecord {
  id: number;
  documentId?: string;
  title?: string;
  description?: string;
  video_url?: string;
  duration?: string;
  user?: {
    id?: number;
    username?: string;
  } | null;
}

interface LessonFormState {
  title: string;
  description: string;
  video_url: string;
  duration: string;
}

const emptyForm: LessonFormState = {
  title: "",
  description: "",
  video_url: "",
  duration: "",
};

const apiUrl = "http://localhost:1337/api";

const AdminLessonsPage = () => {
  const router = useRouter();
  const currentUser = (() => {
    try {
      const cookie = Cookies.get("userData");
      return cookie ? (JSON.parse(cookie) as { userId?: number; roleName?: string }) : null;
    } catch {
      Cookies.remove("userData");
      return null;
    }
  })();
  const currentUserId = Number(currentUser?.userId ?? 0);
  const isInstructor = currentUser?.roleName === "Instructor";
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [form, setForm] = useState<LessonFormState>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => {
    try {
      const cookie = Cookies.get("userData");
      return cookie ? (JSON.parse(cookie) as { authToken?: string }).authToken : null;
    } catch {
      Cookies.remove("userData");
      return null;
    }
  };

  const request = async (path: string, token: string, options: RequestInit = {}) => {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Request failed.");
    }

    return payload;
  };

  const loadLessons = async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const lessonPath = isInstructor && currentUserId
        ? `/lessons?populate=*&filters[user][id][$eq]=${currentUserId}`
        : "/lessons?populate=*";
      const payload = await request(lessonPath, token);
      setLessons(payload?.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load lessons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    loadLessons(token);
  }, [router]);

  const updateForm = <K extends keyof LessonFormState>(field: K, value: LessonFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setEditingDocumentId(null);
    setForm(emptyForm);
  };

  const startEdit = (lesson: LessonRecord) => {
    if (isInstructor && lesson.user && lesson.user.id !== currentUserId) {
      setError("You can only edit your own lessons.");
      return;
    }
    setEditingDocumentId(lesson.documentId ?? String(lesson.id));
    setError("");
    setSuccess("");
    setForm({
      title: lesson.title ?? "",
      description: lesson.description ?? "",
      video_url: lesson.video_url ?? "",
      duration: lesson.duration ?? "",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const ownerUserId = isInstructor ? currentUserId : null;
    if (!form.title.trim() || !form.description.trim() || !form.video_url.trim() || (isInstructor && !ownerUserId)) {
      setError("Title, description, video URL, and instructor ownership are required.");
      setSuccess("");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const path = editingDocumentId ? `/lessons/${editingDocumentId}` : "/lessons";
      const method = editingDocumentId ? "PUT" : "POST";

      await request(path, token, {
        method,
        body: JSON.stringify({
          data: {
            title: form.title,
            description: form.description,
            video_url: form.video_url,
            duration: form.duration || "0:00 m",
            ...(isInstructor ? { user: ownerUserId } : {}),
          },
        }),
      });

      setSuccess(editingDocumentId ? "Lesson updated successfully." : "Lesson created successfully.");
      resetForm();
      await loadLessons(token);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Lesson save failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lesson: LessonRecord) => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    if (isInstructor && lesson.user && lesson.user.id !== currentUserId) {
      setError("You can only delete your own lessons.");
      return;
    }

    const confirmed = window.confirm(`Delete lesson "${lesson.title ?? "this lesson"}"?`);

    if (!confirmed) {
      return;
    }

    try {
      const identifier = lesson.documentId ?? String(lesson.id);
      await request(`/lessons/${identifier}`, token, { method: "DELETE" });
      setSuccess("Lesson deleted successfully.");
      setLessons((current) => current.filter((item) => item.id !== lesson.id));

      if (editingDocumentId === (lesson.documentId ?? String(lesson.id))) {
        resetForm();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Lesson deletion failed.",
      );
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 0" }}>
      <Typography variant="h4" gutterBottom>
        Admin Lessons
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {editingDocumentId ? "Edit Lesson" : "Create New Lesson"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              fullWidth
            />

            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />

            <TextField
              label="Video URL"
              value={form.video_url}
              onChange={(event) => updateForm("video_url", event.target.value)}
              fullWidth
            />

            <TextField
              label="Duration"
              value={form.duration}
              onChange={(event) => updateForm("duration", event.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Saving..." : editingDocumentId ? "Update Lesson" : "Create Lesson"}
              </Button>

              {editingDocumentId && (
                <Button variant="outlined" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </form>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Lessons List
        </Typography>

        {loading ? (
          <Stack sx={{ alignItems: "center" }} py={3}>
            <CircularProgress />
          </Stack>
        ) : lessons.length === 0 ? (
          <Typography>No lessons found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Video URL</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell>{lesson.id}</TableCell>
                    <TableCell>{lesson.title || "-"}</TableCell>
                    <TableCell>{lesson.description || "-"}</TableCell>
                    <TableCell>
                      {lesson.video_url ? (
                        <a href={lesson.video_url} target="_blank" rel="noreferrer">
                          Open video
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{lesson.duration || "-"}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => startEdit(lesson)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDelete(lesson)}
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

export default AdminLessonsPage;