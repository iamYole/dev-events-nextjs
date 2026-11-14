import { randomBytes } from "node:crypto";
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

const generatedSlugs = new WeakMap<object, string>();
const callerSuppliedSlugs = new WeakSet<object>();
const pendingSlugRetries = new WeakMap<object, string>();
const maxSlugRetries = 3;

function createSlug(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createGeneratedSlug(title: string): string {
  const baseSlug = createSlug(title);
  if (!baseSlug) {
    throw new Error("Event title must produce a non-empty slug");
  }

  return `${baseSlug}-${randomBytes(8).toString("hex")}`;
}

function hasSlugKey(value: unknown): boolean {
  return typeof value === "object" && value !== null && "slug" in value;
}

function isDuplicateSlugError(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== 11000
  ) {
    return false;
  }

  if ("keyPattern" in error && hasSlugKey(error.keyPattern)) return true;
  if ("keyValue" in error && hasSlugKey(error.keyValue)) return true;
  return "message" in error && typeof error.message === "string" && /slug_1/.test(error.message);
}

function normalizeDate(value: string): string {
  const date = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Event date must use YYYY-MM-DD format; timestamps are not supported");
  }

  const [year, month, day] = date.split("-").map(Number);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];

  if (!daysInMonth || day < 1 || day > daysInMonth) {
    throw new Error("Event date must be a valid calendar date");
  }

  // Keep the calendar date unchanged; the event's time is stored separately.
  return date;
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
  const currentSlug = this.slug?.trim();
  const previouslyGeneratedSlug = generatedSlugs.get(this);
  if (
    this.isModified("slug") &&
    currentSlug &&
    currentSlug !== previouslyGeneratedSlug
  ) {
    callerSuppliedSlugs.add(this);
  }

  const retrySlug = pendingSlugRetries.get(this);
  if (retrySlug) {
    this.slug = retrySlug;
    pendingSlugRetries.delete(this);
  } else if (
    (this.isNew || this.isModified("title")) &&
    !callerSuppliedSlugs.has(this)
  ) {
    this.slug = createGeneratedSlug(this.title);
    generatedSlugs.set(this, this.slug);
  }

  if (!this.slug?.trim()) {
    throw new Error("Event slug must not be empty");
  }

  // Store dates as YYYY-MM-DD and times as 24-hour HH:mm.
  this.date = normalizeDate(this.date);
  this.time = normalizeTime(this.time);
});

export const Event: Model<EventFields> =
  (mongoose.models.Event as Model<EventFields> | undefined) ??
  mongoose.model<EventFields>("Event", eventSchema);

type EventDocument = ReturnType<typeof Event.hydrate>;
const originalSave = Event.prototype.save;
// Save middleware runs before MongoDB writes, so retry duplicate-key failures here.
Event.prototype.save = async function (
  this: EventDocument,
  ...args: Parameters<EventDocument["save"]>
) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await originalSave.apply(this, args);
    } catch (error) {
      const generatedSlug = generatedSlugs.get(this);
      if (
        !isDuplicateSlugError(error) ||
        !generatedSlug ||
        callerSuppliedSlugs.has(this) ||
        attempt >= maxSlugRetries
      ) {
        pendingSlugRetries.delete(this);
        throw error;
      }

      const nextSlug = createGeneratedSlug(this.title);
      this.slug = nextSlug;
      generatedSlugs.set(this, nextSlug);
      pendingSlugRetries.set(this, nextSlug);
    }
  }
} as typeof Event.prototype.save;
