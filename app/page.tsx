"use client";
import React from "react";
import Image from "next/image";
import styles from './page.module.css'
import { useState } from 'react';
import Button from "@mui/material/Button";
import CourseGrid from "@/app/components/CourseGrid/CourseGrid";
import useFetchCoursesData from "./hooks/useFetchCourseData";
import wrapper from './courses/courses.module.scss';
export default function Home() {
  const [course, setCourseData] = useState();
  async function fetchQuery() {
    const base_url = `http://localhost:1337/api`;
    const response = await fetch(`${base_url}/courses`);
    const data = await response.json();
    setCourseData(data.data[0]);
    console.log(data);
    return data;
  }
  const courses = useFetchCoursesData();
  const enrolledCourses = useFetchCoursesData({ authOnly: true });
  const enrolledCourseIds = enrolledCourses.map((course: any) =>
    String(course?.documentId ?? course?.id ?? ""),
  );

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        {/* Learning Management System */}
      </div>
      <div >
        <CourseGrid courseData={courses} disabledCourseIds={enrolledCourseIds} />
      </div>
    </main>
  );
}