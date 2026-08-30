"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { getStrapiApiUrl } from "@/app/lib/strapiClient";
import {
    Alert, Button, CircularProgress, FormControl, InputLabel, ListItemText,
    MenuItem, OutlinedInput, Paper, Select, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";

interface UserOption { id: number; username: string; }
interface LessonOption { id: number; title: string; }
interface CourseRecord {
    id: number;
    documentId?: string;
    title?: string;
    description?: string;
    user?: UserOption | null;
    lessons?: LessonOption[];
    enrolledUsers?: UserOption[];
    thumbnail?: { id?: number; name?: string } | null;
}
interface CourseFormState {
    title: string;
    description: string;
    user: string;
    lessons: number[];
    enrolledUsers: number[];
    thumbnail: number | null;
    thumbnailName: string;
}

const emptyForm: CourseFormState = {
    title: "", description: "", user: "", lessons: [], enrolledUsers: [],
    thumbnail: null, thumbnailName: "",
};

const AdminCoursesPage = () => {
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
    const [courses, setCourses] = useState<CourseRecord[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [lessons, setLessons] = useState<LessonOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CourseFormState>(emptyForm);
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
        const response = await fetch(getStrapiApiUrl(path), {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
                ...options.headers,
            },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.message ?? "Request failed.");
        return payload;
    };

    const loadData = async (token: string) => {
        setLoading(true);
        try {
            const coursePath = isInstructor && currentUserId
                ? `/courses?populate=*&filters[user][id][$eq]=${currentUserId}`
                : "/courses?populate=*";
            const lessonPath = isInstructor && currentUserId
                ? `/lessons?populate=*&filters[user][id][$eq]=${currentUserId}`
                : "/lessons?populate=*";
            const [coursePayload, userPayload, lessonPayload] = await Promise.all([
                request(coursePath, token), request("/users", token), request(lessonPath, token),
            ]);
            setCourses(coursePayload?.data ?? []);
            setUsers(Array.isArray(userPayload) ? userPayload : userPayload?.data ?? []);
            setLessons(lessonPayload?.data ?? lessonPayload ?? []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load courses.");
        } finally { setLoading(false); }
    };

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push("/login"); return; }
        loadData(token);
    }, [router]);

    const updateForm = <K extends keyof CourseFormState>(field: K, value: CourseFormState[K]) => {
        setForm((current) => ({ ...current, [field]: value }));
    };
    const resetForm = () => { setEditingId(null); setForm(emptyForm); };

    const uploadThumbnail = async (file: File, token: string) => {
        const body = new FormData();
        body.append("files", file);
        const payload = await request("/upload", token, { method: "POST", body });
        return Number(payload?.[0]?.id);
    };

    const submitCourse = async (event: React.FormEvent) => {
        event.preventDefault();
        const token = getToken();
        if (!token) { router.push("/login"); return; }
        const ownerUserId = isInstructor ? currentUserId : Number(form.user);
        if (!form.title.trim() || !form.description.trim() || !ownerUserId) {
            setError("Title, description, and instructor are required."); return;
        }
        setSubmitting(true); setError(""); setSuccess("");
        try {
            let thumbnailId = form.thumbnail;
            const file = document.querySelector<HTMLInputElement>("#course-thumbnail")?.files?.[0];
            if (file) thumbnailId = await uploadThumbnail(file, token);
            const data = {
                title: form.title, description: form.description, user: ownerUserId,
                lessons: form.lessons, enrolledUsers: form.enrolledUsers,
                ...(thumbnailId ? { thumbnail: thumbnailId } : {}),
            };
            await request(editingId ? `/courses/${editingId}` : "/courses", token, {
                method: editingId ? "PUT" : "POST", body: JSON.stringify({ data }),
            });
            setSuccess(editingId ? "Course updated successfully." : "Course created successfully.");
            resetForm(); await loadData(token);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Course save failed.");
        } finally { setSubmitting(false); }
    };

    const startEdit = (course: CourseRecord) => {
        if (isInstructor && course.user?.id && course.user.id !== currentUserId) {
            setError("You can only edit your own courses.");
            return;
        }
        setEditingId(course.documentId ?? String(course.id));
        setForm({
            title: course.title ?? "", description: course.description ?? "",
            user: course.user?.id ? String(course.user.id) : String(currentUserId),
            lessons: (course.lessons ?? []).map((lesson) => lesson.id),
            enrolledUsers: (course.enrolledUsers ?? []).map((user) => user.id),
            thumbnail: course.thumbnail?.id ?? null, thumbnailName: course.thumbnail?.name ?? "",
        });
        setError(""); setSuccess("");
    };

    const deleteCourse = async (course: CourseRecord) => {
        const token = getToken();
        if (!token) { router.push("/login"); return; }
        if (isInstructor && course.user?.id && course.user.id !== currentUserId) {
            setError("You can only delete your own courses.");
            return;
        }
        if (!window.confirm(`Delete ${course.title ?? "this course"}?`)) return;
        try {
            await request(`/courses/${course.documentId ?? course.id}`, token, { method: "DELETE" });
            setCourses((current) => current.filter((item) => item.id !== course.id));
            setSuccess("Course deleted successfully.");
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Course deletion failed.");
        }
    };

    return (
        <Stack spacing={3} sx={{ maxWidth: 1200, mx: "auto", py: 3 }}>
            <Typography variant="h4">Admin Courses</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{editingId ? "Edit Course" : "Create New Course"}</Typography>
                <form onSubmit={submitCourse}>
                    <Stack spacing={2}>
                        <TextField label="Title" value={form.title} onChange={(event) => updateForm("title", event.target.value)} fullWidth required />
                        <TextField label="Description" value={form.description} onChange={(event) => updateForm("description", event.target.value)} multiline minRows={3} fullWidth required />
                        {/* <FormControl fullWidth required><InputLabel id="course-user-label">Instructor</InputLabel><Select labelId="course-user-label" value={form.user} label="Instructor" onChange={(event) => updateForm("user", event.target.value)}>{users.map((user) => <MenuItem key={user.id} value={user.id}>{user.username}</MenuItem>)}</Select></FormControl> */}
                        <FormControl fullWidth><InputLabel id="course-lessons-label">Lessons</InputLabel><Select multiple labelId="course-lessons-label" value={form.lessons} input={<OutlinedInput label="Lessons" />} onChange={(event) => updateForm("lessons", event.target.value as number[])} renderValue={(selected) => (selected as number[]).map((id) => lessons.find((lesson) => lesson.id === id)?.title ?? id).join(", ")}>{lessons.map((lesson) => <MenuItem key={lesson.id} value={lesson.id}><ListItemText primary={lesson.title} /></MenuItem>)}</Select></FormControl>
                        {/* <FormControl fullWidth><InputLabel id="course-enrolled-label">Enrolled Users</InputLabel><Select multiple labelId="course-enrolled-label" value={form.enrolledUsers} input={<OutlinedInput label="Enrolled Users" />} onChange={(event) => updateForm("enrolledUsers", event.target.value as number[])} renderValue={(selected) => (selected as number[]).map((id) => users.find((user) => user.id === id)?.username ?? id).join(", ")}>{users.map((user) => <MenuItem key={user.id} value={user.id}><ListItemText primary={user.username} /></MenuItem>)}</Select></FormControl> */}
                        <Button component="label" variant="outlined">{form.thumbnailName ? `Thumbnail: ${form.thumbnailName}` : "Upload Thumbnail"}<input id="course-thumbnail" type="file" accept="image/*" hidden onChange={(event) => updateForm("thumbnailName", event.target.files?.[0]?.name ?? "")} /></Button>
                        <Stack direction="row" spacing={2}><Button type="submit" variant="contained" disabled={submitting}>{submitting ? "Saving..." : editingId ? "Update Course" : "Create Course"}</Button>{editingId && <Button variant="outlined" onClick={resetForm}>Cancel</Button>}</Stack>
                    </Stack>
                </form>
            </Paper>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Courses List</Typography>
                {loading ? <Stack sx={{ alignItems: "center" }} py={3}><CircularProgress /></Stack> : courses.length === 0 ? <Typography>No courses found.</Typography> : <TableContainer><Table><TableHead><TableRow><TableCell>ID</TableCell><TableCell>Title</TableCell><TableCell>Instructor</TableCell><TableCell>Lessons</TableCell><TableCell>Thumbnail</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{courses.map((course) => <TableRow key={course.id}><TableCell>{course.id}</TableCell><TableCell>{course.title || "-"}</TableCell><TableCell>{course.user?.username || "-"}</TableCell><TableCell>{course.lessons?.length ?? 0}</TableCell><TableCell>{course.thumbnail?.name || "-"}</TableCell><TableCell align="right"><Stack direction="row" spacing={1} justifyContent="flex-end"><Button variant="outlined" onClick={() => startEdit(course)}>Edit</Button><Button variant="contained" color="error" onClick={() => deleteCourse(course)}>Delete</Button></Stack></TableCell></TableRow>)}</TableBody></Table></TableContainer>}
            </Paper>
        </Stack>
    );
};

export default AdminCoursesPage;