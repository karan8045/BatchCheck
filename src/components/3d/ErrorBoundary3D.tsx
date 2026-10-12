"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Static2DFallback } from "./Static2DFallback";

interface Props {
  children: ReactNode;
  status?: "default" | "flagged" | "expired" | "no_match";
  isScanning?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary3D extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("3D Canvas rendering error encountered, falling back to 2D view:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Static2DFallback
          status={this.props.status || "default"}
          isScanning={this.props.isScanning}
        />
      );
    }

    return this.props.children;
  }
}

