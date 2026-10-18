// Parents' corner page. Spec: README section 16.12. Mockup: design/mockups/.
import { mountPage } from "../app";
import { comingSoon } from "../components/states";

mountPage({
  page: "parents",
  title: "Parents' corner",
  back: "more",
  tabs: ["parents", "announcements", "info"],
  // TODO: build this page from `data` (see the README section above).
  render: () => comingSoon("Parents' corner"),
});
