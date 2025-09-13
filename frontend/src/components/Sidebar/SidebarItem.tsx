import React from "react";
import Link from "next/link";
import SidebarDropdown from "@/components/Sidebar/SidebarDropdown";

const SidebarItem = ({ item, pageName, setPageName, currentRole }: any) => {
  const handleClick = () => {
    const updatedPageName =
      pageName !== item.label.toLowerCase() ? item.label.toLowerCase() : "";
    return setPageName(updatedPageName);
  };
  
  const hasAccess = item.roles.includes(currentRole);
  if (!hasAccess) return null;

  return (
    <>
      <li>
        <Link
          href={item.route}
          onClick={handleClick}
          className={`group relative flex items-center gap-3 sm:gap-4 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3.5 font-medium transition-all duration-300 ease-in-out ${
            pageName === item.label.toLowerCase() 
              ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 border border-blue-200/50 dark:border-blue-400/30" 
              : "text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-gray-900/20 hover:border hover:border-blue-200/30 dark:hover:border-gray-700/30"
          }`}
        >
          <div className={`transition-all duration-300 ${
            pageName === item.label.toLowerCase() 
              ? "text-blue-600 dark:text-blue-400 scale-110" 
              : "text-gray-500 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:scale-105"
          }`}>
            {item.icon}
          </div>
          <span className={`transition-all duration-300 text-sm sm:text-base ${
            pageName === item.label.toLowerCase() 
              ? "font-semibold" 
              : "group-hover:font-medium"
          }`}>
            {item.label}
          </span>
          {item.message && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
              {item.message}
            </span>
          )}
          {item.pro && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
              Pro
            </span>
          )}
          {item.children && (
            <svg
              className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current text-gray-400 dark:text-gray-500 transition-all duration-300 ${
                pageName !== item.label.toLowerCase() && "rotate-180"
              } group-hover:text-blue-500 dark:group-hover:text-blue-400`}
              width="20"
              height="20"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.5525 7.72801C10.81 7.50733 11.1899 7.50733 11.4474 7.72801L17.864 13.228C18.1523 13.4751 18.1857 13.9091 17.9386 14.1974C17.6915 14.4857 17.2575 14.5191 16.9692 14.272L10.9999 9.15549L5.03068 14.272C4.7424 14.5191 4.30838 14.4857 4.06128 14.1974C3.81417 13.9091 3.84756 13.4751 4.13585 13.228L10.5525 7.72801Z"
                fill=""
              />
            </svg>
          )}
        </Link>

        {item.children && (
          <div
            className={`translate transform overflow-hidden ${
              pageName !== item.label.toLowerCase() && "hidden"
            }`}
          >
            <SidebarDropdown item={item.children} />
          </div>
        )}
      </li>
    </>
  );
};

export default SidebarItem;
