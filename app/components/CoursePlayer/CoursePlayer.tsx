import React, { useEffect, useState } from "react";
import scss from "./CoursePlayer.module.scss";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import { Paper, Typography } from "@mui/material";
import { LessonType } from "@/app/courses/course.types";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

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

export type CoursePlayerProps = {
  lessons: LessonType[];
  lessonVideoUrl: string;
};

const CoursePlayer = (props: CoursePlayerProps) => {
  const { lessons, lessonVideoUrl } = props;
  const validLessonVideoUrl = normalizeVideoUrl(lessonVideoUrl);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const searchParams = useSearchParams();
  const lessonParamId = searchParams.get("lessonId");
  const hasLessons = Array.isArray(lessons) && lessons.length > 0;
  const hasVideoUrl = Boolean(validLessonVideoUrl && validLessonVideoUrl.trim());

  useEffect(() => {
    const userDataCookie = Cookies.get("userData");

    if (!userDataCookie) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const parsedUserData = JSON.parse(userDataCookie) as {
        authToken?: string;
        isLoggedIn?: boolean;
        userId?: number;
      };
      setIsLoggedIn(Boolean(parsedUserData.authToken && parsedUserData.userId));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    // Checks and updates selectedLessonId when lessonParamId changes on page load
    setSelectedLessonId(lessonParamId ? parseInt(lessonParamId, 10) : null);
  }, [lessonParamId]);

  return (
    <Paper
      className={scss.CoursePlayer}
      sx={{
        display: "flex",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "30rem",
        maxHeight: "30rem",
      }}
    >
      {!isLoggedIn ? (
        <div style={{ display: "block", textAlign: "center" }}>
          <PsychologyAltIcon
            color={"warning"}
            style={{ fontSize: "5rem" }}
          ></PsychologyAltIcon>
          <Typography>Login First</Typography>
        </div>
      ) : !hasLessons || !hasVideoUrl ? (
        <div style={{ display: "block", textAlign: "center" }}>
          <PsychologyAltIcon
            color={"error"}
            style={{ fontSize: "5rem" }}
          ></PsychologyAltIcon>
          <Typography>
            Oops! There are currently no lessons on this course.
          </Typography>
        </div>
      ) : (
        <iframe
          width="100%"
          height="480"
          src={validLessonVideoUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Embedded youtube"
        />
      )}
    </Paper>
  );
};

export default CoursePlayer;