/**
 * A crawlable, screen-reader-friendly text version of the portfolio.
 *
 * The site is a WebGL canvas, so its real content — resume, projects, contact —
 * is invisible to search engines, link scrapers and screen readers. This builds
 * a semantic <main> from the very same data the game uses (src/content.js), so
 * there is one source of truth and the two can never drift. It is visually
 * hidden (see .sr-content) but present in the DOM and read by assistive tech.
 */

import { VFS, DIALOGUE } from "../content.js";
import { renderMarkdown } from "./desktop/apps/textViewer.js";
import { asset } from "../paths.js";

export function mountTextFallback() {
  const main = document.createElement("main");
  main.className = "sr-content";
  main.setAttribute("aria-label", "Nathan Ngo — portfolio (text version)");

  const parts = ["<h1>Nathan Ngo — Software Engineer, Boston</h1>"];

  // Intro (readme), minus its own leading heading so the page keeps one h1.
  const readme = childByName(VFS, "readme.md");
  if (readme?.body) parts.push(renderMarkdown(stripLeadingHeading(readme.body)));

  // Projects — each project's own h1 is demoted to sit under a Projects section.
  const projects = childByName(VFS, "projects");
  if (projects?.children?.length) {
    parts.push("<section><h2>Projects</h2>");
    for (const project of projects.children) {
      if (project.body)
        parts.push(`<article>${demoteHeadings(renderMarkdown(project.body))}</article>`);
    }
    parts.push("</section>");
  }

  // Skills, pulled from the shelf dialogue (first line is a lead-in, so drop it).
  const skills = DIALOGUE.shelf?.lines?.slice(1) ?? [];
  if (skills.length) {
    parts.push(`<section><h2>Skills</h2><p>${escapeHtml(skills.join(" · "))}</p></section>`);
  }

  // Contact links + résumé.
  parts.push('<nav aria-label="Contact"><h2>Contact</h2><ul>');
  for (const link of DIALOGUE.mailbox?.links ?? []) {
    parts.push(`<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`);
  }
  parts.push(`<li><a href="${escapeHtml(asset("assets/resume.pdf"))}">Résumé (PDF)</a></li>`);
  parts.push("</ul></nav>");

  main.innerHTML = parts.join("");
  document.body.prepend(main);
}

function childByName(dir, name) {
  return dir.children?.find((n) => n.name === name);
}

function stripLeadingHeading(body) {
  return body.replace(/^\s*#.*\n?/, "");
}

/** Shift h1–h3 down two levels so section headings stay above article ones. */
function demoteHeadings(html) {
  return html.replace(/<(\/?)h([1-3])>/g, (_, slash, level) => `<${slash}h${Number(level) + 2}>`);
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}
