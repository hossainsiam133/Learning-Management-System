'use client';
import Image from "next/image";
import styles from './page.module.css'
import { useState } from 'react';
import Button from "@mui/material/Button";
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
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        Learning Management System
        <Button variant='contained' onClick={() => fetchQuery()}>Courses</Button>
      </div>
      <div>{course?.title}</div>
    </main>
  );
}