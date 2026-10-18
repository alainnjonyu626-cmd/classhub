// 404 page. README section 16.17.
import "../styles/main.css";
import { prefs } from "../lib/cache";
import { $, el, mount } from "../lib/dom";
import { hubLink, siteLink } from "../lib/links";

const lastHub = prefs.get("lastHub");

mount(
  $("#app"),
  el(
    "main",
    { class: "wrap px-6 pt-20 pb-10 text-center" },
    el("p", { class: "text-[64px] leading-none font-bold tracking-tight text-accent" }, "404"),
    el("h1", { class: "mt-3 mb-2 text-[22px] font-bold" }, "This page went missing"),
    el("p", { class: "text-muted" }, "Like a CA date buried in the class WhatsApp group 😅 The link may be old or typed wrong."),
    el("div", { class: "mt-7 flex flex-col gap-2.5" },
      lastHub ? el("a", { class: "btn", href: hubLink("home", {}, lastHub) }, "Go to my class hub") : null,
      el("a", { class: lastHub ? "btn btn-light" : "btn", href: siteLink("") }, "What is ClassHub?"),
    ),
  ),
);
