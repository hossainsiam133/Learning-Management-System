"use client";
import React from "react";
import useFetchCoursesData from "../hooks/useFetchCourseData";
import CourseGrid from "@/app/components/CourseGrid/CourseGrid";
import CourseHeader from "@/app/components/CourseHeader";

const CoursePage = () => {
    const courses = useFetchCoursesData({ authOnly: false });
    const enrolledCourses = useFetchCoursesData({ authOnly: true });
    const enrolledCourseIds = enrolledCourses.map((course: any) =>
        String(course?.documentId ?? course?.id ?? ""),
    );

    return (
        <div>
            <CourseHeader
                href={"/"}
                title={"Courses"}
                description={
                    "Choose from our many courses and start your learning journey today!"
                }
            />
            <CourseGrid courseData={courses} disabledCourseIds={enrolledCourseIds} />
        </div>
    );
};

export default CoursePage;