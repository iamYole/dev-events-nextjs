import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { EventFields } from "@/database";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import { cacheLife } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const bookings = 10;

function EventDetails({ icon, alt, label }: { icon: string; alt: string; label: string }) {
  return (
    <div className="flex-row-gap-2 items-center">
      <Image src={icon} alt={alt} width={17} height={17} />
      <p>{label}</p>
    </div>
  );
}

function AgendaItems({ agendaItems }: { agendaItems: string[] }) {
  return (
    <div className="agenda">
      <h2>Agenda</h2>
      <ul>
        {agendaItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function EventTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-row gap-1.5 flex-wrap">
      {tags.map((tag) => (
        <div className="pill" key={tag}>
          {tag}
        </div>
      ))}
    </div>
  );
}

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  "use cache";
  cacheLife("hours");

  const { slug } = await params;
  const similarEvents: EventFields[] = await getSimilarEventsBySlug({ slug });

  const request = await fetch(`${BASE_URL}/api/events/${slug}`);
  const {
    event: {
      _id,
      title,
      description,
      image,
      overview,
      venue,
      location,
      date,
      time,
      tags,
      mode,
      agenda,
      audience,
      organizer,
    },
  } = await request.json();

  if (!title) return notFound();

  return (
    <section id="event">
      <div className="header">
        <h1>Event description</h1>
        <p className="mt-2">{description}</p>
      </div>
      <div className="details">
        {/* left side - Event details */}
        <div className="content">
          <Image src={image} alt="event banner" width={800} height={800} className="banner" />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>
            <EventDetails icon="/icons/calendar.svg" alt="calender" label={date} />
            <EventDetails icon="/icons/clock.svg" alt="clock" label={time} />
            <EventDetails icon="/icons/pin.svg" alt="pin" label={venue} />
            <EventDetails icon="/icons/pin.svg" alt="pin" label={location} />
            <EventDetails icon="/icons/mode.svg" alt="mode" label={mode} />
            <EventDetails icon="/icons/audience.svg" alt="audience" label={audience} />
          </section>

          <AgendaItems agendaItems={agenda} />

          <EventTags tags={tags} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{organizer}</p>
          </section>
        </div>
        {/* right side - booking form  */}
        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join <strong>{bookings}</strong> people who has already booked their spot
              </p>
            ) : (
              <p className="text-sm">Be the first to book a spot</p>
            )}
            <BookEvent eventId={_id} slug={slug} />
          </div>
        </aside>
      </div>

      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events</h2>
        <div className="events">
          {similarEvents.length > 0 &&
            similarEvents.map((event) => (
              <EventCard
                title={event.title}
                image={event.image}
                location={event.location}
                slug={event.slug}
                date={event.date}
                time={event.time}
                key={event.slug}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
