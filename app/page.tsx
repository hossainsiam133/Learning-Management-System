'use client';
import Image from "next/image";
import styles from './page.module.css'
import { useState } from 'react';
import Button from "@mui/material/Button";
export default function Home() {
  const [course, setCourseData] = useState<any[]>([]);
  async function fetchQuery() {
    const base_url = `http://localhost:1337/api`;
    const response = await fetch(`${base_url}/courses`);
    const json = await response.json();
    setCourseData(json.data);
    console.log(json.data);
    // return course;
  }
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        Learning Management System
        <Button variant='contained' onClick={() => fetchQuery()}>Courses</Button>
      </div>
      {/* <div> {course.map((c) => (<div key={c.id}>{c.title}:<br />{c.description}<br /></div>))} </div> */}
    </main>
  );
}
