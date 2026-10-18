// Class info: who's who and where things are.
// Spec: README section 16.13. Mockup: design/mockups/class-info.html

import { mountPage } from "../app";
import { emptyState } from "../components/states";
import { avatar, dueBadge, iconBox, initials, list, row, section, sectionTitle } from "../components/ui";
import { atTime, parseDate, today } from "../lib/dates";
import { el } from "../lib/dom";
import { isSafeUrl, waChat } from "../lib/links";

mountPage({
  page: "class-info",
  title: "Class info",
  back: "more",
  tabs: ["info", "leaders", "places"],
  render: ({ hub, data }) => {
    const info = data.info;
    const tones = ["dark", "accent", "soft"] as const;
    const groupLink = isSafeUrl(info.whatsapp_group) ? info.whatsapp_group : null;
    const channelLink = isSafeUrl(info.channel) ? info.channel : null;
    const due = parseDate(info.contribution_due);

    const sections = [
      // Class card
      el("section", { class: "mt-5" }, el("div", { class: "card text-center" },
        el("p", { class: "text-[13px] text-muted" }, info.class_name || hub.subtitle),
        el("h2", { class: "text-xl font-bold" }, hub.school),
        el("p", { class: "text-[13px] text-muted" },
          [info.year, info.students ? `${info.students} students` : null].filter(Boolean).join(" · ")),
      )),

      // Leaders (WhatsApp button only when the sheet has their number)
      data.leaders.length
        ? section(sectionTitle("Class leaders"), list(data.leaders.map((l, i) => row({
            lead: avatar(l.name, tones[i % tones.length]),
            title: l.name,
            meta: l.role,
            trail: l.whatsapp
              ? el("a", { class: "btn btn-wa btn-sm", href: waChat(l.whatsapp), target: "_blank", rel: "noopener", "aria-label": `WhatsApp ${l.name}` }, "WhatsApp")
              : null,
          }))))
        : null,

      // Group links
      groupLink || channelLink
        ? section(sectionTitle("Groups"), el("div", { class: "flex flex-col gap-2.5" },
            groupLink ? el("a", { class: "btn btn-wa w-full", href: groupLink, target: "_blank", rel: "noopener" }, "Join the class WhatsApp group") : null,
            channelLink ? el("a", { class: "btn btn-light w-full", href: channelLink, target: "_blank", rel: "noopener" }, "Join the announcements channel") : null))
        : null,

      // Places
      data.places.length
        ? section(sectionTitle("Important places"), list(data.places.map((p) => row({
            href: p.mapLink ?? undefined,
            external: true,
            lead: iconBox(initials(p.name).slice(0, 2) || "•"),
            title: p.name,
            meta: p.directions,
            trail: p.mapLink ? el("span", { class: "text-[13px] font-medium text-accent-ink" }, "Map") : null,
          }))))
        : null,

      // Contribution
      info.contribution
        ? section(sectionTitle("Class contribution"), el("div", { class: "card flex items-center gap-3" },
            el("div", { class: "min-w-0 flex-1" },
              el("p", { class: "text-sm font-semibold" }, info.contribution),
              due ? el("p", { class: "text-[13px] text-muted" }, `Pay by ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`) : null),
            due && due.getTime() >= today().getTime() ? dueBadge(atTime(due, null)) : null))
        : null,
    ];

    const hasContent = data.leaders.length || data.places.length || groupLink || channelLink || info.contribution;
    return hasContent ? sections : [sections[0], el("div", { class: "mt-4" }, emptyState("More class info will appear here soon."))];
  },
});
