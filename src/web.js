import { AI_CRAWLERS, evaluateRobotsAccess } from "./robots.js";

const form = document.querySelector("#policy-form");
const pathInput = document.querySelector("#path");
const robotsInput = document.querySelector("#robots");
const results = document.querySelector("#results");
const resultTitle = document.querySelector("#result-title");

const purposeLabel = {
  search: "Search discovery",
  "user-requested": "User-requested retrieval",
  training: "Model training",
};

function normalizePath(value) {
  const path = value.trim() || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function render() {
  const path = normalizePath(pathInput.value);
  const policy = robotsInput.value;
  results.replaceChildren();

  for (const crawler of AI_CRAWLERS) {
    const evaluation = evaluateRobotsAccess(policy, crawler.userAgent, path);
    const row = document.createElement("tr");
    const values = [
      crawler.userAgent,
      purposeLabel[crawler.purpose],
      evaluation.allowed ? "Allowed" : "Blocked",
      evaluation.matchedRule ?? "No matching rule",
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    row.dataset.allowed = String(evaluation.allowed);
    results.append(row);
  }

  resultTitle.textContent = `Access rules for ${path}`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  render();
});

render();
