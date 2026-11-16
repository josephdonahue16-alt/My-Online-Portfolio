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

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
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

  history.replaceState(null, "", `#${tab.dataset.hash}`);
}

// Tabs are linkable: josephdonahue.net/#work opens the Work tab.
const tabForHash = (hash) => tabs.find((tab) => `#${tab.dataset.hash}` === hash);
const tabBar = document.querySelector(".tab-bar");

const initialTab = tabForHash(location.hash);
if (initialTab) selectTab(initialTab);

window.addEventListener("hashchange", () => {
  const tab = tabForHash(location.hash);
  if (tab) selectTab(tab);
});

for (const link of document.querySelectorAll('a[href^="#"]')) {
  const tab = tabForHash(link.getAttribute("href"));
  if (!tab) continue;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    selectTab(tab);
    tabBar.scrollIntoView({ behavior: reduceMotionQuery.matches ? "auto" : "smooth" });
  });
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

// Video: click the cover (or play button) to start, then use the normal controls.
for (const player of document.querySelectorAll(".video-player")) {
  const video = player.querySelector("video");
  const playButton = player.querySelector(".video-play");

  const start = () => {
    video.controls = true;
    player.classList.add("is-playing");
    video.play();
  };

  playButton.addEventListener("click", start);
  video.addEventListener("click", () => {
    if (!video.controls) start();
  });
}

// Pause any playing video when switching tabs.
for (const tab of document.querySelectorAll('[role="tab"]')) {
  tab.addEventListener("click", () => {
    for (const video of document.querySelectorAll("video")) video.pause();
  });
}

// Hero: a LiDAR-style point cloud of rolling ground, colored by depth.
// It sweeps in once on load (skipped when reduced motion is on), then stays still.
const scanCanvas = document.querySelector(".scan");

if (scanCanvas) {
  const ctx = scanCanvas.getContext("2d");
  const ramp = [
    [74, 125, 255], // near: blue
    [47, 209, 192], // mid: teal
    [240, 185, 74], // far: amber
  ];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NEAR = 1.2;
  const FAR = 13;
  let points = [];

  const colorAt = (t) => {
    const scaled = Math.min(t, 0.999) * (ramp.length - 1);
    const i = Math.floor(scaled);
    const f = scaled - i;
    return ramp[i].map((c, k) => Math.round(c + (ramp[i + 1][k] - c) * f));
  };

  const ground = (x, z) =>
    0.18 * Math.sin(x * 1.3 + z * 0.6) +
    0.12 * Math.cos(z * 1.1 - x * 0.4) +
    1.1 * Math.exp(-((x - 2.4) ** 2 + (z - 5) ** 2) / 2.2);

  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = scanCanvas.getBoundingClientRect();
    scanCanvas.width = Math.round(width * dpr);
    scanCanvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const focal = Math.max(width, 700) * 0.55;
    const horizon = height * 0.04;
    const camHeight = 2.3;
    const camX = width < 640 ? -0.6 : -2.2;
    points = [];

    for (let z = NEAR; z < FAR; z += 0.09 + z * 0.012) {
      const step = 0.06 + z * 0.014;
      for (let x = -9; x < 9; x += step) {
        const jitter = (Math.sin(x * 91.7 + z * 47.3) * 43758.5) % 1;
        const y = ground(x, z);
        const sx = width / 2 + ((x - camX) * focal) / z;
        const sy = horizon + ((camHeight - y) * focal) / z;
        if (sx < -4 || sx > width + 4 || sy < -4 || sy > height + 4) continue;
        const t = (z - NEAR) / (FAR - NEAR);
        points.push({
          sx: sx + jitter * 1.5,
          sy,
          z,
          r: Math.max(1, 2.4 - t * 1.5),
          alpha: 1 - t * 0.45,
          rgb: colorAt(t),
        });
      }
    }
    points.sort((a, b) => b.z - a.z);
    return { width, height };
  }

  function draw(reach) {
    const { width, height } = scanCanvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    for (const p of points) {
      if (p.z > reach) continue;
      const edge = reach - p.z < 0.35 && reach < FAR;
      ctx.fillStyle = edge
        ? "rgba(255, 255, 255, 0.95)"
        : `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${p.alpha})`;
      ctx.fillRect(p.sx, p.sy, edge ? p.r * 1.4 : p.r, edge ? p.r * 1.4 : p.r);
    }
  }

  build();

  if (reduceMotion) {
    draw(FAR);
  } else {
    const duration = 1600;
    const start = performance.now();
    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      draw(NEAR + (FAR + 0.4 - NEAR) * eased);
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
      draw(FAR + 1);
    }, 120);
  });
}

// Sticky tab bar: show the "JD" mark and a solid edge once the hero scrolls away.
const hero = document.querySelector(".hero");
if (hero && tabBar && "IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    tabBar.classList.toggle("is-stuck", !entry.isIntersecting);
  }).observe(hero);
}
