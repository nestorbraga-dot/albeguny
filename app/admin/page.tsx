"use client";

import Admin from "@/src/components/Admin";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const handleNavigate = (view: "store" | "kitchen" | "admin") => {
    if (view === "store") {
      router.push("/");
    } else if (view === "kitchen") {
      router.push("/cozinha");
    }
  };

  return <Admin onNavigateToView={handleNavigate} />;
}
