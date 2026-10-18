// School directory. README section 16.2.
import "../styles/main.css";
import { SCHOOLS } from "../config/hubs";
import { $, el, mount } from "../lib/dom";
import { param, siteLink } from "../lib/links";

const schoolId = param("school");
const school = schoolId ? SCHOOLS[schoolId] : undefined;
if (!school) location.replace(siteLink("404.html"));

// TODO: school header, search, list of classes grouped by level, parents card, "continue to my class".
mount($("#app"), el("main", { class: "wrap py-10" }, el("h1", { class: "text-2xl font-bold" }, school?.name ?? "")));
