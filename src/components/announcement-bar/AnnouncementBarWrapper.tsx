import { cookies } from "next/headers";

import { getCookie } from "cookies-next/server";

import { HIDE_ANNOUNCEMENT_BAR_COOKIE } from "@/lib/local-cookies";

import { AnnouncementBar } from "./AnnouncementBar";

export async function AnnouncementBarWrapper() {
  const hideAnnouncementBar = await getCookie(HIDE_ANNOUNCEMENT_BAR_COOKIE, {
    cookies,
  });
  if (hideAnnouncementBar) return null;

  return <AnnouncementBar />;
}
