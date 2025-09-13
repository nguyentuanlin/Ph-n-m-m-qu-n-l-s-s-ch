"use client";
import React, { useEffect, useState } from "react";
import DataStatsOne from "@/components/DataStats/DataStatsOne";
import TableCourse from "../Tables/TableCourse";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const CourseDashboard: React.FC = () => {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/signin");
    }
    try {
      if (token === null) {
        router.push("/auth/signin");
      } else {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          localStorage.removeItem("token");
          router.push("/auth/signin");
        }
      }
    } catch (error) {
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, []);

  return (
    <>
      <DataStatsOne />
      <TableCourse />
    </>
  );
};

export default CourseDashboard;
