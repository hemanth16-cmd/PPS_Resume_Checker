import { RotateCcw, TriangleAlert } from "lucide-react";
import { Component, type ReactNode } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { EmptyState, Page } from "@/components/layout/page";
import { Button } from "@/components/ui/button";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[PPS] Page crashed:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Page>
        <EmptyState
          icon={<TriangleAlert />}
          title="Something went wrong on this page"
          description={this.state.error.message || "An unexpected error occurred."}
          action={
            <Button variant="secondary" onClick={() => this.setState({ error: null })}>
              <RotateCcw /> Try again
            </Button>
          }
        />
      </Page>
    );
  }
}

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : (error as Error)?.message;
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        icon={<TriangleAlert />}
        title="This page couldn't be loaded"
        description={message}
        action={
          <Button asChild variant="secondary">
            <Link to="/">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
