import { Event, type EventFields } from "@/database";
import connectToDatabase from "@/lib/mongodb";
import { NextResponse, type NextRequest } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

type EventInput = Omit<EventFields, "createdAt" | "updatedAt" | "image" | "slug"> & { slug?: string };
type EventFormInput = EventInput & { image: File };

class InvalidEventFormError extends Error {}

function requiredText(formData: FormData, field: string): string {
  const value = formData.get(field);
  if (typeof value !== "string" || !value.trim()) {
    throw new InvalidEventFormError(`${field} must be a non-empty text value`);
  }
  return value.trim();
}

function requiredTextList(formData: FormData, field: string): string[] {
  const formValues = formData.getAll(field);
  if (formValues.length === 0) {
    throw new InvalidEventFormError(`${field} must contain at least one value`);
  }

  const textValues: string[] = [];
  for (const value of formValues) {
    if (typeof value !== "string" || !value.trim()) {
      throw new InvalidEventFormError(`${field} must contain non-empty text values`);
    }
    textValues.push(value.trim());
  }

  let values: unknown = textValues;
  if (textValues.length === 1) {
    const encodedValue = textValues[0].replace(/,\s*$/, "");
    try {
      values = JSON.parse(encodedValue);
    } catch {
      const value = encodedValue;
      if (value.startsWith("[") || value.startsWith("{")) {
        throw new InvalidEventFormError(`${field} must contain valid JSON`);
      }
    }
  }

  if (typeof values === "string") {
    values = [values];
  }
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    !values.every(
      (value: unknown): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
  ) {
    throw new InvalidEventFormError(`${field} must be a non-empty JSON array of strings`);
  }

  return values.map((value) => value.trim());
}

function requiredImage(formData: FormData): File {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    throw new InvalidEventFormError("image must be a non-empty image file");
  }
  if (!image.type.startsWith("image/")) {
    throw new InvalidEventFormError("image must be an image file");
  }
  return image;
}

function parseEventFormData(formData: FormData): EventFormInput {
  const slugValue = formData.get("slug");
  if (slugValue !== null && typeof slugValue !== "string") {
    throw new InvalidEventFormError("slug must be text");
  }
  const slug = typeof slugValue === "string" ? slugValue.trim() : "";

  return {
    title: requiredText(formData, "title"),
    ...(slug ? { slug } : {}),
    description: requiredText(formData, "description"),
    overview: requiredText(formData, "overview"),
    image: requiredImage(formData),
    venue: requiredText(formData, "venue"),
    location: requiredText(formData, "location"),
    date: requiredText(formData, "date"),
    time: requiredText(formData, "time"),
    mode: requiredText(formData, "mode"),
    audience: requiredText(formData, "audience"),
    agenda: requiredTextList(formData, "agenda"),
    organizer: requiredText(formData, "organizer"),
    tags: requiredTextList(formData, "tags"),
  };
}

async function uploadImage(file: File): Promise<UploadApiResponse> {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary is not configured; set CLOUDINARY_URL");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "dev-events" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary returned no upload result"));
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json({ message: "Request must use multipart/form-data" }, { status: 415 });
  }

  let eventForm: EventFormInput;
  try {
    const formData = await req.formData();
    eventForm = parseEventFormData(formData);
  } catch (error) {
    if (error instanceof InvalidEventFormError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ message: "Could not read the multipart form-data request" }, { status: 400 });
  }
  try {
    const { image, ...eventFields } = eventForm;
    const uploadResult = await uploadImage(image);
    await connectToDatabase();
    const createdEvent = await Event.create({
      ...eventFields,
      image: uploadResult.secure_url,
    });
    return NextResponse.json(
      {
        message: "Event created successfully",
        event: createdEvent,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Event creation failed",
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const events = await Event.find().sort({ createAt: -1 });
    return NextResponse.json({ message: "Event fetched successfully", events }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Event fetching failed", error: error }, { status: 500 });
  }
}
