"use client";

import { createBooking } from "@/lib/actions/booking.actions";
import posthog from "posthog-js";
import React, { useState } from "react";

export default function BookEvent({ eventId, slug }: { eventId: string; slug: string }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { success } = await createBooking({ eventId, slug, email });

    if (!success) {
      console.log("Booking creation failed");
      posthog.captureException("Booking creation failed");
    } else {
      setSubmitted(true);
      posthog.capture("event_booked", { eventId, slug, email });
    }
  }

  return (
    <div id="book-event">
      {submitted ? (
        <p className="text-sm">Thank you for sign in up</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              placeholder="user@email.com"
            />
          </div>
          <button className="button-submit">SUBMIT</button>
        </form>
      )}
    </div>
  );
}
