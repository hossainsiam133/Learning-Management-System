"use client";
import React from "react";
import Link from "next/link";
import { Avatar, Button, Paper, Typography } from "@mui/material";
import scss from "./CourseCard.module.scss";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export type CourseCardProps = {
  title: string;
  description: string;
  courseId: string | number;
  thumbnail?: string;
  isEnrollDisabled?: boolean;
};

const getImageSource = (thumbnail?: string) => {
  if (!thumbnail) {
    return "https://placehold.co/600x400/eeeeee/777777?text=Course";
  }

  if (/^https?:\/\//i.test(thumbnail)) {
    return thumbnail;
  }

  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
  const cleanThumbnail = thumbnail.startsWith("/") ? thumbnail : `/${thumbnail}`;

  return `${baseUrl.replace(/\/$/, "")}${cleanThumbnail}`;
};

const CourseCard = (props: CourseCardProps) => {
  const { title, description, courseId, thumbnail, isEnrollDisabled = false } = props;
  const router = useRouter();
  const courseKey = String(courseId);

  const handleEnroll = async () => {
    const userDataCookie = Cookies.get("userData");
    if (!userDataCookie) {
      router.push("/login");
      return;
    }

    try {
      const parsedUserData = JSON.parse(userDataCookie) as {
        authToken?: string;
        userId?: number;
      };

      if (!parsedUserData.authToken || !parsedUserData.userId) {
        router.push("/login");
        return;
      }

      const courseResponse = await fetch(
        process.env.NEXT_PUBLIC_STRAPI_URL
          ? `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/courses/${courseKey}?populate=enrolledUsers`
          : `http://localhost:1337/api/courses/${courseKey}?populate=enrolledUsers`,
        {
          headers: {
            Authorization: `Bearer ${parsedUserData.authToken}`,
          },
        },
      );

      if (!courseResponse.ok && courseResponse.status !== 404) {
        router.push("/login");
        return;
      }

      const existingCourse = courseResponse.ok ? await courseResponse.json() : null;
      const enrolledUserIds = Array.isArray(existingCourse?.data?.enrolledUsers)
        ? existingCourse.data.enrolledUsers.map((item: any) => Number(item.id))
        : [];

      if (enrolledUserIds.includes(parsedUserData.userId)) {
        router.push("/my-courses");
        return;
      }

      const updateResponse = await fetch(
        process.env.NEXT_PUBLIC_STRAPI_URL
          ? `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/courses/${courseKey}`
          : `http://localhost:1337/api/courses/${courseKey}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parsedUserData.authToken}`,
          },
          body: JSON.stringify({
            data: {
              enrolledUsers: {
                connect: [{ id: parsedUserData.userId }],
              },
            },
          }),
        },
      );

      if (!updateResponse.ok) {
        const errorPayload = await updateResponse.text();
        console.error("Enrollment failed:", errorPayload);
        router.push("/login");
        return;
      }

      router.push("/my-courses");
    } catch (error) {
      console.error("Enrollment error:", error);
      router.push("/login");
    }
  };

  return (
    <Paper
      className={scss.CourseCard}
      variant={"elevation"}
      sx={{
        p: 2,
        backgroundColor: "transparent",
      }}
    >
      <Link className={scss.courseLink} href={`/courses/${courseKey}`}>
        <Image
          src={getImageSource(thumbnail)}
          className={scss.cardImage}
          alt={title}
          title={description}
          width={150}
          height={150}
        />
      </Link>
      <Typography
        sx={{
          fontSize: 12,
          color: "primary.light",
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        Course
      </Typography>
      <Typography
        variant={"body1"}
        component={"h2"}
        sx={{
          fontWeight: 700,
          fontSize: "16px",
          marginBottom: "0.25rem",
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: "small" }}>{description}</Typography>
      <div className={scss.author} style={{ marginBottom: "1rem" }}>
        <Avatar sx={{ height: 34, width: 34 }} />
        <Typography sx={{ fontSize: "small" }}>CPS Academy</Typography>
      </div>
      <Button
        variant="contained"
        color="success"
        fullWidth
        disabled={isEnrollDisabled}
        onClick={isEnrollDisabled ? undefined : handleEnroll}
      >
        {isEnrollDisabled ? "Enrolled" : "Enroll"}
      </Button>
    </Paper>
  );
};

export default CourseCard;