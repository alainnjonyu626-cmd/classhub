// Parents' corner: dates, fees, meetings, requirements, school contacts.
// Spec: README section 16.12. Mockup: design/mockups/.
// Secondary mode only. No individual student info, fees owed or results here. Ever.

import { mountPage } from "../app";
import { L } from "../config/labels";
import { emptyState } from "../components/states";
import { CATEGORY_CARD, categoryTag, dueBadge, list, row, section, sectionTitle } from "../components/ui";
import { uses } from "../lib/data";
import { formatDate, relativeDay, today } from "../lib/dates";
import { el } from "../lib/dom";
import { hubLink, isSafeUrl } from "../lib/links";
import type { ParentItem, ParentSection } from "../types/sheet";

const SECTIONS: { id: ParentSection; title: string }[] = [
  { id: "dates", title: "Key dates" },
  { id: "fees", title: "Fees" },
  { id: "meetings", title: "Meetings" },
  { id: "requirements", title: "Requirements" },
  { id: "contacts", title: "Contact the school office" },
];

mountPage({
  page: "parents",
  title: "Parents' corner",
  back: "more",
  tabs: ["parents", "announcements", "info"],
  render: ({ hubId, hub, data }) => {
    // University hubs have no Parents' corner: send direct visitors to Home
    if (!L("parents") || !uses(hub, "parents")) {
      location.replace(hubLink("home", {}, hubId));
      return [];
    }

    const news = data.announcements.filter((a) => a.category === "parents").slice(0, 3);
    const blocks = SECTIONS.map(({ id, title }) => {
      const items = data.parents.filter((p) => p.section === id);
      return items.length ? section(sectionTitle(title), list(items.sort(byDate).map(item))) : null;
    });

    const newsBlock = news.length
      ? section(sectionTitle("News for parents", { label: "All news", href: hubLink("announcements", { filter: "parents" }, hubId) }),
          el("div", { class: "flex flex-col gap-2.5" }, news.map((a) =>
            el("a", { href: hubLink("announcement", { id: String(a.id) }, hubId), class: `card ${CATEGORY_CARD[a.category]} flex flex-col gap-1.5` },
              el("span", {}, categoryTag(a.category)),
              el("h3", { class: "text-base leading-snug font-semibold" }, a.title),
              el("p", { class: "text-xs text-muted" }, `${a.author ?? "School office"} · ${relativeDay(a.date)}`)))))
      : null;

    if (!data.parents.length && !news.length) {
      return [el("div", { class: "mt-4" }, emptyState("The school will post information for parents here soon."))];
    }
    return [...blocks.slice(0, 4), newsBlock, blocks[4]];
  },
});

/** Dated items first (soonest first), undated ones keep sheet order below. */
function byDate(a: ParentItem, b: ParentItem): number {
  if (a.date && b.date) return a.date.getTime() - b.date.getTime();
  return a.date ? -1 : b.date ? 1 : 0;
}

function item(p: ParentItem): HTMLElement {
  const future = p.date !== null && p.date.getTime() >= today().getTime();
  const link = isSafeUrl(p.link) ? p.link : null;
  const meta = [p.date ? formatDate(p.date) : null, p.detail].filter(Boolean).join(" · ");
  return row({
    href: link ?? undefined,
    external: true,
    title: p.title,
    meta,
    trail: future && p.date
      ? dueBadge(p.date)
      : link ? el("span", { class: "text-[13px] font-medium text-accent-ink" }, p.section === "contacts" ? "WhatsApp" : "Open") : null,
  });
}
