"use server";

import { Booking } from "@/database";
import connectToDatabase from "../mongodb";

export async function createBooking({ eventId, slug, email }: { eventId: string; slug: string; email: string }) {
  try {
    await connectToDatabase();

    const booking = await Booking.create({ eventId, slug, email });

    return { success: true };
  } catch (error) {
    console.log("creating booking failed");
    return { success: false };
  }
}
