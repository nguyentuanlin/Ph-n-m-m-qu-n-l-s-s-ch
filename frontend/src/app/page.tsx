import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import React from "react";
import CourseDashboard from "@/components/Dashboard/Course-Dashboard";

export const metadata: Metadata = {
  title:
    "CMC University - Hệ thống MOOC",
  description: "CMC University - Hệ thống MOOC",
};

export default function Home() {
  return (
    <>
      <DefaultLayout>
        <CourseDashboard />
      </DefaultLayout>
    </>
  );
}
