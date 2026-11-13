"use client";

import Image from "next/image";
import { eventDirectoryLogger } from "@/lib/posthog-logs";
import posthog from "posthog-js";

export default function ExploreBtn() {
  const handleExplore = () => {
    posthog.capture("event_directory_explored");
    eventDirectoryLogger.info("Event directory exploration requested", {
      action: "explore_events",
    });
  };

  return (
    <button type="button" id="explore-btn" className="mt-7 mx-auto">
      <a href="#events" onClick={handleExplore}>
        Explore Events <Image src="/icons/arrow-down.svg" alt="arrow-down" width={24} height={24} />
      </a>
    </button>
  );
}
