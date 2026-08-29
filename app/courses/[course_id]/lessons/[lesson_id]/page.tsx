"use client";
import React from "react";
import useFetchLessonData from "../../../../hooks/useFetchLessonData";
import CourseHeader from "@/app/components/CourseHeader";

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

const LessonPage: React.FC = () => {
  const urlParts = window.location.pathname.split("/");
  const lessonId: number = Number(urlParts[urlParts.length - 1]);
  const courseId: number = Number(urlParts[urlParts.length - 3]);

  // Fetch lesson data using the lesson ID
  const lesson: any = useFetchLessonData(lessonId);
  const safeLessonVideoUrl = normalizeVideoUrl(lesson?.video_url);

  return (
    <div>
      {lesson ? (
        <div style={{ maxWidth: "80rem", margin: "auto" }}>
          <CourseHeader
            href={`/courses/${courseId}`}
            title={lesson?.title}
            description={lesson?.description}
          />
          <iframe
            width="80%"
            height="480"
            style={{ display: "flex", margin: "auto" }}
            src={safeLessonVideoUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded youtube"
          />
          <p>{lesson?.description}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default LessonPage;