"use client";
import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import useFetchCoursesData from "@/app/hooks/useFetchCourseData";
import CourseHeader from "@/app/components/CourseHeader";
import scss from "./course.module.scss";
import CourseList from "@/app/components/CourseList";
import CoursePlayer from "@/app/components/CoursePlayer";
import { useParams, useSearchParams } from "next/navigation";

const normalizeVideoUrl = (videoUrl?: string): string => {
  const rawValue = (videoUrl ?? "").trim();

  if (!rawValue) {
    return "";
  }

  const safeUrl = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  try {
    const url = new URL(safeUrl);
    const host = url.hostname.toLowerCase();

    if (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be"
    ) {
      if (url.pathname.includes("/embed/")) {
        return url.toString();
      }

      const videoId =
        host === "youtu.be"
          ? url.pathname.replace("/", "").split("/")[0]
          : new URLSearchParams(url.search).get("v");

      if (!videoId) {
        return "";
      }

      return `https://www.youtube.com/embed/${videoId}`;
    }

    return url.toString();
  } catch {
    return "";
  }
};

const CoursePage = () => {
  const params = useParams();
  const courseId = Number(params.course_id);
  const courses = useFetchCoursesData();
  const course =
    courses.find((item: any) => Number(item?.id ?? item?.documentId) === courseId) ??
    courses[0];

  const rawLessons = Array.isArray(course?.lessons)
    ? course.lessons
    : Array.isArray(course?.lessons?.data)
      ? course.lessons.data
      : [];
  const lessons = Array.isArray(rawLessons) ? rawLessons : [];
  const lessonAmount = lessons.length;

  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const lessonParamId = searchParams.get("lessonId");

  useEffect(() => {
    const parsed = Number(lessonParamId ?? "");
    const validLessonId = lessons.some(
      (lesson: any) => Number(lesson?.id ?? lesson?.attributes?.id) === parsed,
    )
      ? parsed
      : Number(lessons[0]?.id ?? lessons[0]?.attributes?.id ?? 1);

    setSelectedLessonId(validLessonId || 1);
  }, [lessonParamId, lessons]);

  const selectedLesson =
    lessons.find(
      (lesson: any) => Number(lesson?.id ?? lesson?.attributes?.id) === selectedLessonId,
    ) ?? lessons[0];

  const lessonVideoUrl = normalizeVideoUrl(
    selectedLesson?.video_url ?? selectedLesson?.attributes?.video_url,
  );

  return (
    <div>
      <CourseHeader
        title={course?.title}
        description={course?.description}
        user={course?.user?.data?.username}
      />
      <Box className={scss.courseFrame} sx={{ bgcolor: "background.paper" }}>
        <CourseList
          lessons={lessons}
          lessonAmount={lessonAmount}
          courseId={courseId}
        />
        <CoursePlayer lessons={lessons} lessonVideoUrl={lessonVideoUrl} />
      </Box>
    </div>
  );
};

export default CoursePage;