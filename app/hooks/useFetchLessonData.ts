import { useEffect, useState } from "react";
import { getStrapiApiUrl } from "@/app/lib/strapiClient";

const useFetchLessonData = (lessonId: any) => {
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    async function fetchLessonData() {
      try {
        const response = await fetch(
          getStrapiApiUrl(`/lessons/${lessonId}`),
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const lessonData = await response.json();
        setLesson(lessonData.data.attributes);
      } catch (error) {
        console.error("Error fetching lesson data:", error);
      }
    }

    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  return lesson;
};

export default useFetchLessonData;