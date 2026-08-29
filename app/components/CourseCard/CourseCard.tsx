"use client";
import React from "react";
import Link from "next/link";
import { Avatar, Paper, Typography } from "@mui/material";
import scss from "./CourseCard.module.scss";
import Image from "next/image";

export type CourseCardProps = {
  title: string;
  description: string;
  courseId: number;
  thumbnail?: string;
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
  const { title, description, courseId, thumbnail } = props;

  return (
    <Link className={scss.courseLink} href={`/courses/${courseId}`}>
      <Paper
        className={scss.CourseCard}
        variant={"elevation"}
        sx={{
          p: 2,
          backgroundColor: "transparent",
        }}
      >
        <Image
          src={getImageSource(thumbnail)}
          className={scss.cardImage}
          alt={title}
          title={description}
          width={150}
          height={150}
        />
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
      </Paper>
    </Link>
  );
};

export default CourseCard;