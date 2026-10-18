// Landing page (your selling page). README section 16.1. Mockup: design/mockups/landing.html
import "../styles/main.css";
import { OWNER } from "../config/hubs";
import { $, el, mount } from "../lib/dom";
import { hubLink, waChat } from "../lib/links";

// TODO: build the full landing page (hero, problem, features, how it works, price, FAQ).
mount(
  $("#app"),
  el(
    "main",
    { class: "wrap py-16" },
    el("p", { class: "tag" }, "For class delegates & schools"),
    el("h1", { class: "mt-3 text-[34px] leading-tight font-bold tracking-tight" }, "Your class. One link. Nothing gets buried."),
    el("p", { class: "mt-4 text-muted" }, "Announcements, timetable, deadlines, handouts and past questions in one place."),
    el("div", { class: "mt-6 flex flex-col gap-2.5" },
      el("a", { class: "btn", href: hubLink("home", {}, "demo") }, "See a live example"),
      el("a", { class: "btn btn-wa", href: waChat(OWNER.whatsapp, "Hello, I'd like a ClassHub for my class") }, "Chat with us"),
    ),
  ),
);
