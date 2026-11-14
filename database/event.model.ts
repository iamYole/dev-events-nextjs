import mongoose, { Schema, type Model } from "mongoose";

export interface EventFields {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const requiredText = () => ({
  type: String,
  required: true,
  trim: true,
  validate: {
    validator: (value: string) => value.trim().length > 0,
    message: "This field cannot be empty",
  },
});

const eventSchema = new Schema<EventFields>(
  {
    title: requiredText(),
    slug: { type: String, trim: true },
    description: requiredText(),
    overview: requiredText(),
    image: requiredText(),
    venue: requiredText(),
    location: requiredText(),
    date: requiredText(),
    time: requiredText(),
    mode: requiredText(),
    audience: requiredText(),
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: (items: string[]) =>
          items.length > 0 && items.every((item) => item.trim().length > 0),
        message: "Agenda must contain at least one non-empty item",
      },
    },
    organizer: requiredText(),
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (items: string[]) =>
          items.length > 0 && items.every((item) => item.trim().length > 0),
        message: "Tags must contain at least one non-empty item",
      },
    },
  },
  { timestamps: true },
);

eventSchema.index({ slug: 1 }, { unique: true });

function createSlug(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDate(value: string): string {
  const trimmedValue = value.trim();
  const isoDate = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})(?:T.*)?$/);
  if (isoDate) {
    const datePart = isoDate[1];
    const dateOnly = new Date(`${datePart}T00:00:00.000Z`);
    if (
      !Number.isFinite(dateOnly.getTime()) ||
      dateOnly.toISOString().slice(0, 10) !== datePart
    ) {
      throw new Error("Event date must be a valid date");
    }
  }

  const parsed = new Date(trimmedValue);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error("Event date must be a valid date");
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeTime(value: string): string {
  const twelveHourTime = value.match(
    /^\s*(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)\s*$/i,
  );
  if (twelveHourTime) {
    const [, hourText, minute, meridiem] = twelveHourTime;
    let hour = Number(hourText) % 12;
    if (meridiem.toUpperCase() === "PM") hour += 12;
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  const twentyFourHourTime = value.match(/^\s*([01]?\d|2[0-3]):([0-5]\d)\s*$/);
  if (twentyFourHourTime) {
    const [, hour, minute] = twentyFourHourTime;
    return `${hour.padStart(2, "0")}:${minute}`;
  }

  throw new Error("Event time must be in HH:mm or h:mm AM/PM format");
}

eventSchema.pre("save", function () {
  // Regenerate the URL slug only when the title is new or has changed.
  if (this.isNew || this.isModified("title")) {
    const slug = createSlug(this.title);
    if (!slug) {
      throw new Error("Event title must produce a non-empty slug");
    }
    this.slug = slug;
  } else if (!this.slug?.trim()) {
    throw new Error("Event slug must not be empty");
  }

  // Store dates as YYYY-MM-DD and times as 24-hour HH:mm.
  this.date = normalizeDate(this.date);
  this.time = normalizeTime(this.time);
});

export const Event: Model<EventFields> =
  (mongoose.models.Event as Model<EventFields> | undefined) ??
  mongoose.model<EventFields>("Event", eventSchema);
