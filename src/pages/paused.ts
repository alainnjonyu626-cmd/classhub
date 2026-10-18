// Paused page: shown when a hub has active: false. README section 16.16.
import { mountPage } from "../app";
import { fullMessage } from "../components/states";
import { siteLink } from "../lib/links";

mountPage({
  page: "paused",
  tabs: [],
  noNav: true,
  render: ({ hub }) =>
    fullMessage(
      `${hub.name} is paused`,
      "This class hub is paused for now. Please contact your delegate or school office.",
      { label: "What is ClassHub?", href: siteLink("") },
    ),
});
