"use client";

import Loja from "@/src/components/Loja";
import { useRouter } from "next/navigation";

export default function StorePage() {
  const router = useRouter();

  const handleNavigate = (view: "store" | "kitchen" | "admin") => {
    if (view === "kitchen") {
      router.push("/cozinha");
    } else if (view === "admin") {
      router.push("/admin");
    }
  };

  return <Loja onNavigateToView={handleNavigate} />;
}
