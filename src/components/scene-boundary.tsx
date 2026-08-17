"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onFallback?: () => void;
};

type State = { failed: boolean };

export class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFallback?.();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}