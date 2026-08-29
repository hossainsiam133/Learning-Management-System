export type CourseDataType = {
  id?: number;
  title?: string;
  description?: string;
  attributes?: {
    title?: string;
    description?: string;
    createdAt?: string;
    publishedAt?: string;
    updatedAt?: string;
    lessons?: LessonType[] | { data?: LessonType[] };
    thumbnail?: {
      url?: string;
      data?: {
        url?: string;
        attributes?: {
          url?: string;
        };
      };
    };
  };
  lessons?: LessonType[] | { data?: LessonType[] };
  thumbnail?: {
    url?: string;
    data?: {
      url?: string;
      attributes?: {
        url?: string;
      };
    };
  };
};

export type LessonType = {
  id?: number;
  title?: string;
  description?: string;
  duration?: string;
  video_url?: string;
  attributes?: {
    title?: string;
    description?: string;
    duration?: string;
    video_url?: string;
    createdAt?: string;
    publishedAt?: string;
    updatedAt?: string;
  };
  createdAt?: string;
  publishedAt?: string;
  updatedAt?: string;
};