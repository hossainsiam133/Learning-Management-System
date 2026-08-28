'use client';
import { Metadata } from "next";
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Header from "./components/Header/Header";
import useUserData from "./hooks/useUserData";
const darkTheme = createTheme({
  palette: {
    mode: 'dark', // Enable dark mode
  },
});
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const metadata: Metadata = {
    title: 'LMS',
    description: 'The E-Learning Management System',
  }
  const userData = useUserData();
  return (
    <html lang="en">
      <body style={{ background: 'black', color: 'white', maxWidth: '80rem', margin: 'auto' }}>
        <ThemeProvider theme={darkTheme}>
          <Header userData={userData} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}