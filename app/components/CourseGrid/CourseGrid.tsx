import React from "react";
import CourseCard from "@/app/components/CourseCard/CourseCard";
import scss from "./CourseGrid.module.scss";
import { CourseDataType } from "@/app/courses/course.types";

export type CourseGridProps = {
  courseData: CourseDataType[];
  isEnrollDisabled?: boolean;
  disabledCourseIds?: Array<string | number>;
};

const CourseGrid = (props: CourseGridProps) => {
  const { courseData, isEnrollDisabled = false, disabledCourseIds = [] } = props;
  const disabledCourseKeySet = new Set(disabledCourseIds.map((id) => String(id)));

  return (
    <section className={scss.CourseCardWrapper}>
      {courseData.map((course: CourseDataType) => {
        const thumbnailUrl =
          course?.thumbnail?.url ??
          course?.attributes?.thumbnail?.url ??
          course?.thumbnail?.data?.attributes?.url ??
          course?.thumbnail?.data?.url ??
          course?.attributes?.thumbnail?.data?.attributes?.url ??
          "";

        const courseKey = String(course?.documentId ?? course?.id ?? "");
        const isCourseDisabled = isEnrollDisabled || disabledCourseKeySet.has(courseKey);

        return (
          <div key={courseKey || course.id}>
            <CourseCard
              courseId={courseKey || String(course.id ?? "")}
              title={course?.title ?? course?.attributes?.title ?? ""}
              thumbnail={thumbnailUrl || undefined}
              description={course?.description ?? course?.attributes?.description ?? ""}
              isEnrollDisabled={isCourseDisabled}
            />
          </div>
        );
      })}
    </section>
  );
};

export default CourseGrid;