"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Typography } from "@mui/material";
import Cookies from "js-cookie";
import CourseGrid from "@/app/components/CourseGrid/CourseGrid";
import CourseHeader from "@/app/components/CourseHeader";
import useFetchCoursesData from "@/app/hooks/useFetchCourseData";

const MyCoursesPage = () => {
  const [isReady, setIsReady] = useState(false);
  const [userData, setUserData] = useState<{ authToken?: string; userId?: number } | null>(null);

  useEffect(() => {
    const cookie = Cookies.get("userData");

    if (!cookie) {
      setUserData(null);
      setIsReady(true);
      return;
    }

    try {
      setUserData(JSON.parse(cookie) as { authToken?: string; userId?: number });
    } catch {
      setUserData(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  const enrolledCourses = useFetchCoursesData({ authOnly: true });

  if (!isReady) {
    return <div>Loading...</div>;
  }

  if (!userData?.authToken || !userData?.userId) {
    return (
      <div>
        <CourseHeader
          href="/"
          title="My Courses"
          description="Your enrolled lessons are available after login."
        />
        <Typography sx={{ my: 3 }}>
          Please log in first to view your enrolled courses.
        </Typography>
        <Button variant="contained" color="success" href="/login">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CourseHeader
        href="/"
        title="My Courses"
        description="These are the courses available to your authenticated account."
      />
      {enrolledCourses.length === 0 ? (
        <Typography sx={{ my: 3 }}>
          You do not have any enrolled courses yet.
        </Typography>
      ) : (
        <CourseGrid courseData={enrolledCourses} isEnrollDisabled />
      )}
    </div>
  );
};

export default MyCoursesPage;
