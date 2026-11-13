"use client";

import posthog from "posthog-js";

type LogAttributes = Record<string, string | number | boolean>;

const loggerName = "event_directory";

export const eventDirectoryLogger = {
  info(body: string, attributes: LogAttributes = {}) {
    posthog.logger.info(body, { logger_name: loggerName, ...attributes });
  },
};
