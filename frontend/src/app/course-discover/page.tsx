"use client";
import React from "react";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DataStatsOne from "@/components/DataStats/DataStatsOne";
import TableCourse from "@/components/Tables/TableCourse";
import { displayName } from "react-quill";

const CourseDiscover: React.FC = () => {
    return (
        <DefaultLayout>
            <div className="mx-auto max-w-7xl">
                <Breadcrumb pageName="Khám phá khoá học" />
                <div className="space-y-5">
                    
                </div>
            </div>
        </DefaultLayout>
    );
};

export default CourseDiscover;