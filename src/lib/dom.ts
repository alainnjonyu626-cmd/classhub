// Safe element builder. README rule 4: sheet text ALWAYS goes in as text,
// never as HTML, so nobody can sneak code into a cell.
//
//   el("p", { class: "row-meta" }, "Amphi 250")
//   el("a", { href: "...", class: "btn" }, icon("share"), "Share")

export type Child = Node | string | number | null | undefined | false | Child[];
export type Attrs = Record<string, string | number | boolean | null | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    // Event handlers are attached with addEventListener, never as attributes.
    if (key.startsWith("on")) continue;
    node.setAttribute(key, value === true ? "" : String(value));
  }
  append(node, children);
  return node;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(parent, child);
    else if (child instanceof Node) parent.appendChild(child);
    else parent.appendChild(document.createTextNode(String(child)));
  }
}

/** Replace everything inside `parent` with `children`. */
export function mount(parent: Element, ...children: Child[]): void {
  parent.replaceChildren();
  append(parent, children);
}

/** document.querySelector that throws a clear error if the element is missing. */
export function $<T extends Element = HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`ClassHub: element "${selector}" not found`);
  return found;
}
