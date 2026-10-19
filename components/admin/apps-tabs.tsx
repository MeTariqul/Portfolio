import { pendingKeyRequestCount } from "@/lib/admin-counts";
import { AppsTabsNav } from "@/components/admin/apps-tabs-nav";

// The tab row for every /admin/apps screen. Being a server component, it
// can carry the pending-request count without each page remembering to
// fetch it.
export async function AppsTabs() {
  let pending = 0;
  try {
    pending = await pendingKeyRequestCount();
  } catch {
    // A counting failure should never take the navigation down.
  }
  return <AppsTabsNav pending={pending} />;
}
