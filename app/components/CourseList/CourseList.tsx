import React, { useState, useEffect } from "react";
import scss from "./CourseList.module.scss";
import { LessonType } from "@/app/courses/course.types";
import { List, ListItemButton, ListItemText, Typography } from "@mui/material";
import SlowMotionVideoIcon from "@mui/icons-material/SlowMotionVideo";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@mui/material/styles";

export type CourseListProps = {
  lessons: LessonType[];
  lessonAmount: number;
  courseId: number;
};

const CourseList = (props: CourseListProps) => {
  const { lessons, lessonAmount, courseId } = props;
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const lessonParamId = searchParams.get("lessonId");
  const theme = useTheme();

  useEffect(() => {
    const parsedLessonId = Number(lessonParamId ?? "");
    const validLessonId =
      lessons.some((lesson: any) => Number(lesson?.id ?? lesson?.attributes?.id) === parsedLessonId)
        ? parsedLessonId
        : Number((lessons[0] as any)?.id ?? (lessons[0] as any)?.attributes?.id ?? 1);

    setSelectedLessonId(validLessonId || 1);
  }, [lessonParamId, lessons]);

  const handleLessonClick = (selectedIndex: number) => {
    const lesson = lessons[selectedIndex] as any;
    const lessonId = Number(lesson?.id ?? lesson?.attributes?.id ?? selectedIndex + 1);
    const lessonName = lesson?.attributes?.title ?? lesson?.title ?? "";
    const formattedLessonName = lessonName.replace(/\s+/g, "");
    const newUrl = `/courses/${courseId}?lessonId=${lessonId}&lessonName=${formattedLessonName}`;
    window.history.replaceState(null, "", newUrl);
    setSelectedLessonId(lessonId);
    window.location.reload();
  };

  return (
    <nav className={scss.lessonNavigation}>
      <List
        className={scss.CourseList}
        sx={{
          overflowY: "scroll",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.primary.main,
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        {lessons?.slice(0, lessonAmount).map((lesson: any, id: number) => {
          const title = lesson?.attributes?.title ?? lesson?.title ?? "Untitled lesson";
          const description = lesson?.attributes?.description ?? lesson?.description ?? "";
          const duration = lesson?.attributes?.duration ?? lesson?.duration ?? "";

          return (
            <ListItemButton
              key={lesson.id ?? id}
              className={scss.listItem}
              style={{
                backgroundColor:
                  Number(lesson?.id ?? lesson?.attributes?.id ?? id + 1) === selectedLessonId
                    ? theme.palette.primary.main
                    : "transparent",
              }}
              component="a"
              onClick={() => handleLessonClick(id)}
            >
              <div style={{ textAlign: "center" }}>
                <SlowMotionVideoIcon fontSize="large" />
                <Typography sx={{ fontSize: "small" }}>{duration}</Typography>
              </div>
              <div style={{ marginLeft: "1rem" }}>
                <ListItemText
                  style={{ margin: "0.5rem 0" }}
                  primary={`${id + 1}. ${title}`}
                  secondary={description}
                />
              </div>
            </ListItemButton>
          );
        })}
      </List>
    </nav>
  );
};

export default CourseList;