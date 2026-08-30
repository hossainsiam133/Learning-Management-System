import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { getStrapiApiUrl } from "@/app/lib/strapiClient";

type UseFetchCoursesOptions = {
  authOnly?: boolean;
};

const useFetchCoursesData = (
  options: UseFetchCoursesOptions = {},
): any[] => {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCoursesData() {
      try {
        const userDataCookie = Cookies.get("userData");
        const parsedUserData = userDataCookie
          ? (JSON.parse(userDataCookie) as { authToken?: string; userId?: number })
          : null;

        const authToken = parsedUserData?.authToken;
        const userId = Number(parsedUserData?.userId ?? "");

        if (options.authOnly && (!authToken || !userId)) {
          setCourses([]);
          return;
        }

        const params = new URLSearchParams({ populate: "*" });
        if (options.authOnly && userId) {
          params.set("filters[enrolledUsers][id][$eq]", String(userId));
        }

        const response = await fetch(
          `${getStrapiApiUrl("/courses")}?${params.toString()}`,
          authToken
            ? {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            : undefined,
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setCourses([]);
            return;
          }

          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const coursesData = await response.json();
        setCourses(Array.isArray(coursesData?.data) ? coursesData.data : []);
      } catch (error) {
        console.error("Error fetching courses data:", error);
        setCourses([]);
      }
    }

    fetchCoursesData();
  }, [options.authOnly]);

  return courses;
};

export default useFetchCoursesData;