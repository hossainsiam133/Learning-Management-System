import React from "react";
import CourseCard from "@/app/components/CourseCard/CourseCard";
import scss from "./CourseGrid.module.scss";
import { CourseDataType } from "@/app/courses/course.types";

export type CourseGridProps = {
  courseData: CourseDataType[];
};

const CourseGrid = (props: CourseGridProps) => {
  const { courseData } = props;

  return (
    <section className={scss.CourseGrid}>
      {courseData.map((course: CourseDataType) => {
        const thumbnailUrl =
          course?.thumbnail?.url ??
          course?.attributes?.thumbnail?.url ??
          course?.thumbnail?.data?.attributes?.url ??
          course?.thumbnail?.data?.url ??
          course?.attributes?.thumbnail?.data?.attributes?.url ??
          "";

        return (
          <div key={course.id}>
            <CourseCard
              courseId={course.id}
              title={course?.title ?? course?.attributes?.title ?? ""}
              thumbnail={thumbnailUrl || undefined}
              description={course?.description ?? course?.attributes?.description ?? ""}
            />
          </div>
        );
      })}
    </section>
  );
};

export default CourseGrid;