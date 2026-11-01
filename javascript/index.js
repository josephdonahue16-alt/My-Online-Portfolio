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
