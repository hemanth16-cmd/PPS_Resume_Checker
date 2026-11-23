import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary, RouteError } from "@/components/error-boundary";
import { AppShell } from "@/components/layout/app-shell";
import { Page } from "@/components/layout/page";
import { TooltipProvider } from "@/components/ui/overlays";
import { Skeleton } from "@/components/ui/primitives";
import { StoreProvider, useStore } from "@/lib/store";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Scan = lazy(() => import("@/pages/scan"));
const ScanResultPage = lazy(() => import("@/pages/scan-result"));
const HistoryPage = lazy(() => import("@/pages/history"));
const Compare = lazy(() => import("@/pages/compare"));
const Methodology = lazy(() => import("@/pages/methodology"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const FacultyOverview = lazy(() => import("@/pages/faculty/overview"));
const FacultyReview = lazy(() => import("@/pages/faculty/review"));
const Batch = lazy(() => import("@/pages/batch"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageFallback() {
  return (
    <Page>
      <Skeleton className="mb-3 h-4 w-28" />
      <Skeleton className="mb-8 h-8 w-80 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </Page>
  );
}

const lazyPage = (node: ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<PageFallback />}>{node}</Suspense>
  </ErrorBoundary>
);

function FacultyOnly({ children }: { children: ReactNode }) {
  const { role } = useStore();
  return role === "faculty" ? children : <Navigate to="/" replace />;
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: lazyPage(<Dashboard />) },
      { path: "/scan", element: lazyPage(<Scan />) },
      { path: "/scan/:id", element: lazyPage(<ScanResultPage />) },
      { path: "/history", element: lazyPage(<HistoryPage />) },
      { path: "/compare", element: lazyPage(<Compare />) },
      { path: "/methodology", element: lazyPage(<Methodology />) },
      { path: "/settings", element: lazyPage(<SettingsPage />) },
      { path: "/faculty", element: <FacultyOnly>{lazyPage(<FacultyOverview />)}</FacultyOnly> },
      { path: "/faculty/review", element: <FacultyOnly>{lazyPage(<FacultyReview />)}</FacultyOnly> },
      { path: "/faculty/review/:id", element: <FacultyOnly>{lazyPage(<FacultyReview />)}</FacultyOnly> },
      { path: "/batch", element: <FacultyOnly>{lazyPage(<Batch />)}</FacultyOnly> },
      { path: "*", element: lazyPage(<NotFound />) },
    ],
  },
]);

export default function App() {
  return (
    <StoreProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        <ThemedToaster />
      </TooltipProvider>
    </StoreProvider>
  );
}

function ThemedToaster() {
  const { theme } = useStore();
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-border !bg-elevated !text-fg !shadow-lg !font-sans",
          description: "!text-fg-muted",
        },
      }}
    />
  );
}
