"use client";

import Cozinha from "@/src/components/Cozinha";
import { useRouter } from "next/navigation";

export default function KitchenPage() {
  const router = useRouter();

  const handleNavigate = (view: "store" | "kitchen" | "admin") => {
    if (view === "store") {
      router.push("/");
    } else if (view === "admin") {
      router.push("/admin");
    }
  };

  return <Cozinha onNavigateToView={handleNavigate} />;
}
