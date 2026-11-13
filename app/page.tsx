import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import events from "@/lib/constants";

export default function home() {
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
          {events.map((event) => (
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
