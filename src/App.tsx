import React, { useState } from "react";
import { IceCream, ChefHat, Settings, HelpCircle, Monitor } from "lucide-react";
import Loja from "./components/Loja";
import Cozinha from "./components/Cozinha";
import Admin from "./components/Admin";

type AppView = "store" | "kitchen" | "admin";

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("store");

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* Render Main Selected View */}
      <div className="flex-1">
        {currentView === "store" && <Loja onNavigateToView={(v) => setCurrentView(v)} />}
        {currentView === "kitchen" && <Cozinha onNavigateToView={(v) => setCurrentView(v)} />}
        {currentView === "admin" && <Admin onNavigateToView={(v) => setCurrentView(v)} />}
      </div>
    </div>
  );
}
