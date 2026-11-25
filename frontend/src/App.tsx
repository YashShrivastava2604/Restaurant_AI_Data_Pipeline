
import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { Loader2 } from "lucide-react"

const OverviewPage = lazy(() =>
  import("@/pages/OverviewPage").then((module) => ({
    default: module.OverviewPage,
  }))
)

const AnalyticsPage = lazy(() =>
  import("@/pages/AnalyticsPage").then((module) => ({
    default: module.AnalyticsPage,
  }))
)

const RestaurantsPage = lazy(() =>
  import("@/pages/RestaurantsPage").then((module) => ({
    default: module.RestaurantsPage,
  }))
)

const ReviewsPage = lazy(() =>
  import("@/pages/ReviewsPage").then((module) => ({
    default: module.ReviewsPage,
  }))
)

const AIChatPage = lazy(() =>
  import("@/pages/AIChatPage").then((module) => ({
    default: module.AIChatPage,
  }))
)

const TextToSQLPage = lazy(() =>
  import("@/pages/TextToSQLPage").then((module) => ({
    default: module.TextToSQLPage,
  }))
)

const PipelinePage = lazy(() =>
  import("@/pages/PipelinePage").then((module) => ({
    default: module.PipelinePage,
  }))
)

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/text-to-sql" element={<TextToSQLPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
