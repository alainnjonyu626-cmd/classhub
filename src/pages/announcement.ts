// One announcement: the full message, easy to share.
// Spec: README section 16.5. Mockup: design/mockups/announcement.html

import { L } from "../config/labels";
import { mountPage } from "../app";
import { fullMessage } from "../components/states";
import { avatar, categoryTag, courseMap, iconBox, list, row } from "../components/ui";
import { atTime, formatDate, formatTime, today } from "../lib/dates";
import { el } from "../lib/dom";
import { hubLink, param, prettyCode, waShare } from "../lib/links";

mountPage({
  page: "announcement",
  title: "Announcement",
  back: "announcements",
  tabs: ["announcements", "courses", "deadlines"],
  render: ({ data }) => {
    const id = Number(param("id"));
    const a = data.announcements.find((x) => x.id === id);
    if (!a) {
      return fullMessage("We couldn't find that announcement", `It may have been removed by ${L("managerLower")}.`, {
        label: "See all announcements", href: hubLink("announcements"),
      });
    }
    document.title = `${a.title} · ${document.title.split(" · ").pop() ?? ""}`;

    const course = a.code ? courseMap(data.courses).get(a.code) : undefined;
    const details: [string, string][] = [];
    if (a.code) details.push([L("course"), course ? `${prettyCode(a.code)} · ${course.title}` : prettyCode(a.code)]);
    if (a.when) details.push(["When", a.when]);
    if (a.where) details.push(["Where", a.where]);

    const expired = a.expires !== null && a.expires.getTime() < today().getTime();
    const related = data.deadlines.find((d) => d.announcementId === a.id);
    const shareText = `${a.title}\n\n${location.href}`;

    return el("article", { class: "pt-5" },
      categoryTag(a.category),
      el("h2", { class: "mt-2.5 mb-2 text-[22px] leading-tight font-bold" }, a.title),

      el("div", { class: "flex items-center gap-3 py-3" },
        avatar(a.author ?? L("manager")),
        el("div", {},
          el("p", { class: "font-medium" }, a.author ?? L("manager")),
          el("p", { class: "text-[13px] text-muted" },
            `${formatDate(a.date)}${a.time !== null ? `, ${formatTime(a.time)}` : ""}`),
        ),
      ),

      expired ? el("p", { class: "tag tag-plain mb-3" }, "This announcement has expired") : null,

      details.length
        ? el("dl", { class: "card mb-5 flex flex-col gap-2.5" },
            details.map(([label, value]) =>
              el("div", { class: "flex gap-3 text-sm" },
                el("dt", { class: "w-16 shrink-0 text-muted" }, label),
                el("dd", { class: "font-semibold" }, value),
              )),
          )
        : null,

      // Body keeps the delegate's line breaks (white-space: pre-line)
      el("p", { class: "leading-relaxed whitespace-pre-line" }, a.body),

      a.attachment
        ? el("div", { class: "mt-5" }, list(row({
            href: a.attachment,
            external: true,
            lead: iconBox("PDF", "pdf"),
            title: a.attachmentName ?? "Attachment",
            trail: el("span", { class: "btn btn-light btn-sm" }, "Open"),
          })))
        : null,

      el("div", { class: "mt-6 flex flex-col gap-2.5" },
        el("a", { class: "btn btn-wa w-full", href: waShare(shareText), target: "_blank", rel: "noopener" }, "Share on WhatsApp"),
        el("a", { class: "btn btn-light w-full", href: hubLink("deadlines") },
          related ? `See deadline: ${related.title} · ${formatDate(atTime(related.date, related.time))}` : "See all deadlines"),
      ),
    );
  },
});
