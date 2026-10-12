"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Static2DFallback } from "./Static2DFallback";

export const DynamicHeroScene = dynamic(
  () => import("./HeroScene"),
  {
    ssr: false,
    loading: () => <Static2DFallback status="default" />,
  }
);

export const DynamicResultScene = dynamic(
  () => import("./ResultScene"),
  {
    ssr: false,
    loading: () => <Static2DFallback status="default" />,
  }
);

export const DynamicAboutScene = dynamic(
  () => import("./AboutScene"),
  {
    ssr: false,
    loading: () => null,
  }
);

