"use client";

import Image from "next/image";
import Link from "next/link";
import { eventDirectoryLogger } from "@/lib/posthog-logs";
import posthog from "posthog-js";

interface Props {
  title: string;
  image: string;
  slug: string;
  location: string;
  date: string;
  time: string;
}

export default function EventCard({ title, image, slug, location, date, time }: Props) {
  const handleSelection = () => {
    posthog.capture("event_card_selected", { event_slug: slug });
    eventDirectoryLogger.info("Event card navigation requested", {
      action: "select_event_card",
      event_slug: slug,
    });
  };

  return (
    <Link href={`/events/${slug}`} id="event-card" onClick={handleSelection}>
      <Image src={image} alt={title} width={410} height={300} className="poster" />
      <p className="title">{title}</p>
      <div>
        <Image src="/icons/pin.svg" alt="location" width={14} height={14} />
        <p>{location}</p>

        <div className="datetime">
          <div>
            <Image src="/icons/calendar.svg" alt="date" width={14} height={14} />
            <p>{date}</p>
          </div>
          <div>
            <Image src="/icons/clock.svg" alt="time" width={14} height={14} />
            <p>{time}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
