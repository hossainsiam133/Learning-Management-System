"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import scss from "./admin.module.scss";

interface OverviewStats {
  users: number;
  courses: number;
  lessons: number;
}

const Admin = () => {
  const router = useRouter();
  const [stats, setStats] = useState<OverviewStats>({
    users: 0,
    courses: 0,
    lessons: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOverviewStats = async () => {
      setLoading(true);
      setError("");

      try {
        const userDataCookie = Cookies.get("userData");
        const parsedUserData = userDataCookie
          ? (JSON.parse(userDataCookie) as {
              authToken?: string;
              roleName?: string;
              userId?: number;
            })
          : null;
        const authToken = parsedUserData?.authToken;
        const roleName = parsedUserData?.roleName;
        const currentUserId = Number(parsedUserData?.userId ?? 0);
        const isInstructor = roleName === "Instructor";

        if (!authToken || !["Admin", "Content Manager", "Instructor"].includes(roleName ?? "")) {
          setError("You are not authorized to view this page.");
          setLoading(false);
          router.replace("/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${authToken}`,
        };

        const courseFilter = isInstructor && currentUserId
          ? `?populate=*&filters[user][id][$eq]=${currentUserId}`
          : "?populate=*";
        const lessonFilter = isInstructor && currentUserId
          ? `?populate=*&filters[user][id][$eq]=${currentUserId}`
          : "?populate=*";

        const [usersResponse, coursesResponse, lessonsResponse] = await Promise.all([
          isInstructor
            ? Promise.resolve({ ok: true, json: async () => [] })
            : fetch("http://localhost:1337/api/users", { headers }),
          fetch(`http://localhost:1337/api/courses${courseFilter}`, { headers }),
          fetch(`http://localhost:1337/api/lessons${lessonFilter}`, { headers }),
        ]);

        if (!usersResponse.ok && usersResponse.status !== 401) {
          throw new Error("Failed to load user count.");
        }

        if (!coursesResponse.ok) {
          throw new Error("Failed to load course count.");
        }

        if (!lessonsResponse.ok) {
          throw new Error("Failed to load lesson count.");
        }

        const [usersData, coursesData, lessonsData] = await Promise.all([
          usersResponse.ok ? usersResponse.json() : Promise.resolve([]),
          coursesResponse.json(),
          lessonsResponse.json(),
        ]);

        setStats({
          users: isInstructor ? 0 : Array.isArray(usersData) ? usersData.length : 0,
          courses: Array.isArray(coursesData?.data) ? coursesData.data.length : 0,
          lessons: Array.isArray(lessonsData?.data) ? lessonsData.data.length : 0,
        });
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load overview statistics.",
        );
        setStats({ users: 0, courses: 0, lessons: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewStats();
  }, []);

  const statCards = useMemo(
    () => [
      { label: "Users", value: stats.users, accent: "#1976d2" },
      { label: "Courses", value: stats.courses, accent: "#2e7d32" },
      { label: "Lessons", value: stats.lessons, accent: "#ed6c02" },
    ],
    [stats],
  );

  return (
    <div className={scss.overviewContainer}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1" className={scss.pageTitle}>
          Overview
        </Typography>

        {error ? (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        ) : null}

        {loading ? (
          <Stack sx={{ alignItems: "center" }} py={4}>
            <CircularProgress />
          </Stack>
        ) : (
          <div className={scss.cardGrid}>
            {statCards.map((card) => (
              <Card key={card.label} className={scss.statCard}>
                <CardContent className={scss.cardContent}>
                  <div
                    className={scss.accentBar}
                    style={{ backgroundColor: card.accent }}
                  />
                  <Typography variant="overline" className={scss.cardLabel}>
                    {card.label}
                  </Typography>
                  <Typography variant="h3" className={scss.cardValue}>
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Stack>
    </div>
  );
};

export default Admin;