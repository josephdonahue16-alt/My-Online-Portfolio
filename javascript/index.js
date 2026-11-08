// Files shown at the bottom of each tab.
// To add a file: put it in the "files" folder, then add an entry to the
// matching tab's list below, e.g.
//   resume: [
//     { name: "Resume", file: "files/resume.pdf", description: "Updated November 2026" },
//   ],
const FILES = {
  about: [],
  education: [],
  experience: [],
  resume: [],
};

for (const container of document.querySelectorAll(".tab-files")) {
  const sectionFiles = FILES[container.dataset.section] || [];
  const fileList = container.querySelector(".file-list");
  container.querySelector(".empty-state").hidden = sectionFiles.length > 0;

  for (const { name, file, description } of sectionFiles) {
    const item = document.createElement("li");
    item.className = "file-item";

    const info = document.createElement("div");
    info.className = "file-info";

    const title = document.createElement("p");
    title.className = "file-name";
    title.textContent = name;
    info.append(title);

    if (description) {
      const desc = document.createElement("p");
      desc.className = "file-description";
      desc.textContent = description;
      info.append(desc);
    }

    const link = document.createElement("a");
    link.className = "file-link";
    link.href = file;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Open";

    item.append(info, link);
    fileList.append(item);
  }
}

const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

function selectTab(tab, moveFocus = false) {
  for (const candidate of tabs) {
    const isSelected = candidate === tab;
    candidate.setAttribute("aria-selected", String(isSelected));
    candidate.tabIndex = isSelected ? 0 : -1;
  }

  for (const panel of panels) {
    panel.hidden = panel.id !== tab.getAttribute("aria-controls");
  }

  if (moveFocus) {
    tab.focus();
  }
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectTab(tabs[nextIndex], true);
  });
}

// Contact form: send via FormSubmit without leaving the page.
// Without JavaScript the form still posts normally to FormSubmit.
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = contactForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  formStatus.className = "form-status";
  formStatus.textContent = "";

  try {
    const response = await fetch(contactForm.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(contactForm),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || String(result.success) === "false") {
      throw new Error(result.message || "Request failed");
    }

    contactForm.reset();
    formStatus.classList.add("is-success");
    formStatus.textContent = "Thanks! Your message has been sent.";
  } catch {
    formStatus.classList.add("is-error");
    formStatus.textContent = "Sorry, your message couldn’t be sent. Please try again in a moment.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send message";
  }
});
