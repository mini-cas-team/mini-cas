"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="bg-gray-950 p-4 border-b border-gray-800">
            <div className="max-w-7xl mx-auto flex justify-center">
                <div className="flex space-x-2 bg-gray-900 p-1 rounded-xl shadow-inner border border-gray-800">
                    <Link
                        href="/apply"
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === "/apply" || pathname === "/"
                                ? "bg-gray-800 text-white shadow-sm border border-gray-700"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transparent border border-transparent"
                            }`}
                    >
                        Applicant
                    </Link>
                    <Link
                        href="/admin"
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === "/admin"
                                ? "bg-gray-800 text-white shadow-sm border border-gray-700"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transparent border border-transparent"
                            }`}
                    >
                        Administrator
                    </Link>
                </div>
            </div>
        </nav>
    );
}
