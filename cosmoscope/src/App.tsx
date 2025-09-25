import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Landing = lazy(() => import("@/routes/Landing"));
const SolarSystem = lazy(() => import("@/routes/SolarSystem"));
const Planet = lazy(() => import("@/routes/Planet"));

function FullscreenSpinner() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-space-deep text-neon-blue">
      <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
      <span className="ml-3 text-lg font-semibold uppercase tracking-widest">Loading</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<FullscreenSpinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/system" element={<SolarSystem />} />
        <Route path="/planet/:id" element={<Planet />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
