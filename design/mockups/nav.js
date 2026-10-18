/*
  nav.js builds the top bar and the bottom menu on every page,
  so you only write them once. Like printing one letterhead
  and using it on every page of a document.

  Each page tells it what it is with:
    <body data-page="timetable" data-title="Timetable" data-back="index.html">
*/
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5"/>',
  time: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  due: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
};

const NAV = [
  { id: "home", label: "Home", href: "index.html", icon: "home" },
  { id: "announcements", label: "News", href: "announcements.html", icon: "news", dot: true },
  { id: "timetable", label: "Timetable", href: "timetable.html", icon: "time" },
  { id: "deadlines", label: "Deadlines", href: "deadlines.html", icon: "due" },
  { id: "more", label: "More", href: "more.html", icon: "more" },
];

// Pages inside "More" keep the More tab highlighted
const MORE_PAGES = ["handouts", "past-questions", "courses", "course", "class-info"];

function svg(name, size) {
  return '<svg width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
}

document.addEventListener("DOMContentLoaded", function () {
  const page = document.body.dataset.page;
  const title = document.body.dataset.title;
  const back = document.body.dataset.back;

  // Top bar (not on the home page, which has its own big header)
  if (title) {
    const bar = document.createElement("header");
    bar.className = "topbar";
    bar.innerHTML =
      '<div class="wrap">' +
      (back
        ? '<a class="back" href="' + back + '" aria-label="Go back"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></a>'
        : "") +
      "<h1>" + title + "</h1></div>";
    document.body.prepend(bar);
  }

  // Bottom nav (skipped on the product page)
  if (document.body.dataset.nonav === undefined) {
    const active = MORE_PAGES.includes(page) ? "more" : page;
    const nav = document.createElement("nav");
    nav.className = "nav";
    nav.setAttribute("aria-label", "Main");
    nav.innerHTML =
      '<div class="wrap">' +
      NAV.map(function (n) {
        return (
          '<a href="' + n.href + '" class="' + (n.id === active ? "active" : "") + '"' +
          (n.id === active ? ' aria-current="page"' : "") + ">" +
          svg(n.icon) + (n.dot ? '<span class="dot" aria-label="new"></span>' : "") +
          n.label + "</a>"
        );
      }).join("") +
      "</div>";
    document.body.appendChild(nav);
  }
});
