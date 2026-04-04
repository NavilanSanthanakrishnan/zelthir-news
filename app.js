const contentEl = document.getElementById("content");
const tocListEl = document.getElementById("tocList");
const tocToggleEl = document.getElementById("tocToggle");
const statusBannerEl = document.getElementById("statusBanner");
const heroSummaryEl = document.getElementById("heroSummary");

const metaDateEl = document.getElementById("metaDate");
const metaStageEl = document.getElementById("metaStage");
const metaOwnerEl = document.getElementById("metaOwner");
const metaSectionsEl = document.getElementById("metaSections");

marked.setOptions({
  gfm: true,
  breaks: false,
});

function setStatus(message) {
  statusBannerEl.hidden = !message;
  statusBannerEl.textContent = message || "";
}

function extractMeta(markdown) {
  const date = markdown.match(/^Date:\s*(.+)$/m)?.[1] ?? "Unknown";
  const stage = markdown.match(/^Stage:\s*(.+)$/m)?.[1] ?? "Unknown";
  const owner = markdown.match(/^Owner:\s*(.+)$/m)?.[1] ?? "Unknown";
  return { date, stage, owner };
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function buildToc() {
  const headings = Array.from(
    contentEl.querySelectorAll("h2, h3")
  ).filter((heading) => heading.textContent.trim().length > 0);

  headings.forEach((heading) => {
    if (!heading.id) {
      heading.id = slugify(heading.textContent);
    }
  });

  metaSectionsEl.textContent = String(
    headings.filter((heading) => heading.tagName === "H2").length
  );

  tocListEl.innerHTML = headings
    .map((heading) => {
      const depthClass = heading.tagName === "H3" ? "depth-3" : "depth-2";
      return `<a class="${depthClass}" href="#${heading.id}">${heading.textContent}</a>`;
    })
    .join("");

  const tocLinks = Array.from(tocListEl.querySelectorAll("a"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const id = entry.target.getAttribute("id");
        tocLinks.forEach((link) => {
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === `#${id}`
          );
        });
      });
    },
    {
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    }
  );

  headings.forEach((heading) => observer.observe(heading));
}

function enhanceLinks() {
  Array.from(contentEl.querySelectorAll("a")).forEach((link) => {
    if (link.hostname && link.hostname !== window.location.hostname) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
  });
}

async function renderPrd() {
  if (window.location.protocol === "file:") {
    setStatus(
      "This page renders best from a local server. Open it through localhost if the content does not load."
    );
  }

  try {
    const response = await fetch("./TECHNICAL_PRD.md", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load PRD (${response.status})`);
    }

    const markdown = await response.text();
    const meta = extractMeta(markdown);

    metaDateEl.textContent = meta.date;
    metaStageEl.textContent = meta.stage;
    metaOwnerEl.textContent = meta.owner;

    const firstParagraph = markdown
      .split("\n")
      .find((line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (trimmed.startsWith("#")) return false;
        if (trimmed.startsWith("-")) return false;
        if (trimmed.startsWith("```")) return false;
        if (/^[A-Z][A-Za-z ]+:\s/.test(trimmed)) return false;
        return trimmed.length > 40;
      });

    if (firstParagraph) {
      heroSummaryEl.textContent = firstParagraph.trim();
    }

    contentEl.innerHTML = marked.parse(markdown);
    buildToc();
    enhanceLinks();
  } catch (error) {
    contentEl.innerHTML =
      '<div class="loading-state">Unable to load the PRD. Make sure this folder is being served locally.</div>';
    setStatus(error.message);
  }
}

tocToggleEl.addEventListener("click", () => {
  const isCollapsed = tocListEl.classList.toggle("is-collapsed");
  tocToggleEl.textContent = isCollapsed ? "Show" : "Hide";
});

renderPrd();
