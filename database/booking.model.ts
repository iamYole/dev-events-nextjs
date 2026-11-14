import mongoose, { Schema, Types, type Model } from "mongoose";
import { Event } from "./event.model";

export interface BookingFields {
  eventId: Types.ObjectId;
  slug: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const bookingSchema = new Schema<BookingFields>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => emailPattern.test(value),
        message: "Email must be a valid email address",
      },
    },
  },
  { timestamps: true },
);

bookingSchema.index({ eventId: 1 });

bookingSchema.pre("save", async function () {
  // Ensure the event ID and slug identify the same existing event.
  const eventExists = await Event.exists({ _id: this.eventId, slug: this.slug });
  if (!eventExists) {
    throw new Error("Cannot create a booking for an event that does not match the given ID and slug");
  }
});

export const Booking: Model<BookingFields> =
  (mongoose.models.Booking as Model<BookingFields> | undefined) ??
  mongoose.model<BookingFields>("Booking", bookingSchema);
