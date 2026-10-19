import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Counts the admin shell shows in its badges.
//
// The dashboard layout, the dashboard page and the Apps tab row all want the
// same two numbers, and all three render in the same request. React's cache()
// memoises a call for the lifetime of one request, so wrapping them here
// means the database is asked once instead of three times.

export const unreadMessageCount = cache(async (): Promise<number> =>
  prisma.message.count({ where: { read: false } }),
);

export const pendingKeyRequestCount = cache(async (): Promise<number> =>
  prisma.keyRequest.count({ where: { status: "PENDING" } }),
);
