import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import { EventFields } from "@/database";
import { cacheLife } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default async function home() {
  "use cache";
  cacheLife("hours");
  const response = await fetch(`${BASE_URL}/api/events`);
  const { events } = await response.json();
  return (
    <section>
      <h1 className="text-center">
        The Hub for everyday Dev <br /> Event You Can&apos;t Miss
      </h1>
      <p className="text-center mt-5">Hackatons, Meetups, Conferences, All in one place </p>
      <ExploreBtn />
      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events">
          {events &&
            events.length > 0 &&
            events.map((event: EventFields) => (
              <li key={event.title} className="list-none">
                <EventCard
                  title={event.title}
                  image={event.image}
                  location={event.location}
                  slug={event.slug}
                  date={event.date}
                  time={event.time}
                />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
