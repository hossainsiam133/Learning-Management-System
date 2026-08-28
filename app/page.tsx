'use client';
import Image from "next/image";
import styles from './page.module.css'
import { useState } from 'react';
import Button from "@mui/material/Button";
export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        Learning Management System
      </div>
    </main>
  );
}
