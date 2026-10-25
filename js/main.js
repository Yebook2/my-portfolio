// 본인 GitHub 아이디가 다르면 이 값만 수정한다.
const GITHUB_USERNAME = "Yebook2";

// 1. 화면 요소 선택
const themeButton = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector("#theme-icon");
const menuButton = document.querySelector("#menu-toggle");
const navMenu = document.querySelector("#nav-menu");
const header = document.querySelector("#header");
const topButton = document.querySelector("#scroll-top");
const projectsList = document.querySelector("#projects-list");
const projectFilters = document.querySelector("#project-filters");
const projectCount = document.querySelector("#project-count");
const projectAnnouncement = document.querySelector("#project-announcement");
const projectFeedback = document.querySelector("#project-feedback");
const feedbackIcon = document.querySelector("#feedback-icon");
const feedbackTitle = document.querySelector("#feedback-title");
const feedbackDescription = document.querySelector("#feedback-description");
const retryButton = document.querySelector("#retry-projects");
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const fields = {
  name: document.querySelector("#name"),
  email: document.querySelector("#email"),
  message: document.querySelector("#message"),
};
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
let savedTheme = null;
try {
  savedTheme = localStorage.getItem("theme");
} catch {
  console.warn("저장된 테마를 불러오지 못했습니다.");
}

// 2. 현재 상태를 한곳에 모은다.
const state = {
  theme:
    savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : systemTheme.matches
        ? "dark"
        : "light",
  menuOpen: false,
  headerScrolled: false,
  topVisible: false,
  projectStatus: "idle",
  repos: [],
  language: "all",
  apiError: "",
  errors: { name: "", email: "", message: "" },
  formMessage: "",
};

// 3. 테마와 메뉴: 클릭 → 상태 변경 → 렌더링
const renderTheme = () => {
  document.documentElement.dataset.theme = state.theme;
  themeButton.setAttribute(
    "aria-label",
    state.theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환",
  );
  themeIcon.textContent = state.theme === "dark" ? "☀" : "☾";
};
const renderMenu = () => {
  navMenu.classList.toggle("active", state.menuOpen);
  menuButton.setAttribute("aria-expanded", String(state.menuOpen));
  menuButton.setAttribute(
    "aria-label",
    state.menuOpen ? "메뉴 닫기" : "메뉴 열기",
  );
};
themeButton.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  renderTheme();
  try {
    localStorage.setItem("theme", state.theme);
  } catch {
    console.warn("테마를 저장하지 못했습니다. 현재 페이지에서는 전환됩니다.");
  }
});
menuButton.addEventListener("click", () => {
  state.menuOpen = !state.menuOpen;
  renderMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.menuOpen) {
    state.menuOpen = false;
    renderMenu();
    menuButton.focus();
  }
});
window.matchMedia("(min-width: 768px)").addEventListener("change", () => {
  state.menuOpen = false;
  renderMenu();
});
document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    state.menuOpen = false;
    renderMenu();
    target.scrollIntoView({
      behavior: motionPreference.matches ? "instant" : "smooth",
    });
  });
});

// 4. 스크롤 이벤트와 애니메이션
const renderScroll = () => {
  header.classList.toggle("scrolled", state.headerScrolled);
  topButton.hidden = !state.topVisible;
};
const handleScroll = () => {
  state.headerScrolled = window.scrollY >= 60;
  state.topVisible = window.scrollY >= 300;
  renderScroll();
};
window.addEventListener("scroll", handleScroll, { passive: true });
topButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: motionPreference.matches ? "instant" : "smooth",
  });
});
if ("IntersectionObserver" in window && !motionPreference.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );
  document.querySelectorAll(".reveal-target").forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
}

// 5. GitHub API와 프로젝트 렌더링
const escapeHTML = (value) => {
  const characters = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value).replace(
    /[&<>"']/g,
    (character) => characters[character],
  );
};
const getLanguage = (repo) => repo.language || "미지정";

const renderFilters = () => {
  const languages = ["all", ...new Set(state.repos.map(getLanguage))];
  projectFilters.innerHTML = languages
    .map(
      (language) => `
    <button type="button" class="filter-button${state.language === language ? " active" : ""}"
      data-language="${escapeHTML(language)}" aria-pressed="${state.language === language}"
      ${state.projectStatus === "loading" ? "disabled" : ""}>
      ${escapeHTML(language === "all" ? "전체" : language)}
    </button>
  `,
    )
    .join("");
};

const renderProjects = () => {
  const loading = state.projectStatus === "loading";
  const failed = state.projectStatus === "error";
  const filtered = state.repos.filter(
    (repo) => state.language === "all" || getLanguage(repo) === state.language,
  );
  const empty = !loading && !failed && filtered.length === 0;
  projectsList.setAttribute("aria-busy", String(loading));
  projectFeedback.hidden = !loading && !failed && !empty;
  projectFeedback.classList.toggle("loading", loading);
  retryButton.hidden = !failed;
  projectCount.textContent =
    loading || failed ? "" : `${filtered.length}개의 저장소`;
  projectsList.innerHTML = "";
  renderFilters();

  if (loading) {
    feedbackIcon.textContent = "↻";
    feedbackTitle.textContent = "프로젝트를 불러오는 중입니다.";
    feedbackDescription.textContent = "공개된 저장소를 읽어오고 있습니다.";
  } else if (failed) {
    feedbackIcon.textContent = "!";
    feedbackTitle.textContent = "프로젝트를 불러올 수 없습니다.";
    feedbackDescription.textContent = state.apiError;
  } else if (empty) {
    feedbackIcon.textContent = "∅";
    feedbackTitle.textContent = "표시할 프로젝트가 없습니다.";
    feedbackDescription.textContent = state.repos.length
      ? "다른 언어를 선택해 보세요."
      : "GitHub에 공개 저장소를 추가하면 이곳에 표시됩니다.";
  } else {
    projectsList.innerHTML = filtered
      .map((repo, index) => {
        const { name, description, stargazers_count } = repo;
        const url = `https://github.com/${encodeURIComponent(GITHUB_USERNAME)}/${encodeURIComponent(name)}`;
        return `
        <article class="project-card">
          <div class="project-card-top"><span>REPOSITORY / ${String(index + 1).padStart(2, "0")}</span><span class="repo-icon" aria-hidden="true">⌘</span></div>
          <h3>${escapeHTML(name)}</h3>
          <p class="project-description">${escapeHTML(description || "저장소 설명은 아직 작성하지 않았습니다. 코드와 작업 기록은 GitHub에서 볼 수 있습니다.")}</p>
          <div class="project-meta"><span class="language-tag">${escapeHTML(getLanguage(repo))}</span><span aria-label="별 ${Number(stargazers_count) || 0}개">☆ ${Number(stargazers_count) || 0}</span></div>
          <a class="project-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(name)} 저장소 보기 (새 탭)">저장소 보기 <span aria-hidden="true">↗</span></a>
        </article>`;
      })
      .join("");
  }
  projectAnnouncement.textContent =
    loading || failed || empty
      ? `${feedbackTitle.textContent} ${feedbackDescription.textContent}`
      : `${filtered.length}개의 프로젝트를 표시합니다.`;
};

const loadProjects = async () => {
  if (state.projectStatus === "loading") return;
  state.projectStatus = "loading";
  state.apiError = "";
  renderProjects();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?sort=updated&direction=desc&per_page=100`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error(
          "접근이 제한되었거나 API 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
      if (response.status === 404)
        throw new Error(
          "GitHub 아이디를 찾을 수 없습니다. main.js의 GITHUB_USERNAME을 확인해 주세요.",
        );
      throw new Error(
        `서버 응답에 문제가 있습니다. 오류 코드: ${response.status}`,
      );
    }
    const data = await response.json();
    if (!Array.isArray(data))
      throw new Error("저장소 목록의 형식이 올바르지 않습니다.");
    state.repos = data;
    state.language = "all";
    state.projectStatus = data.length ? "success" : "empty";
  } catch (error) {
    state.repos = [];
    state.projectStatus = "error";
    state.apiError =
      error.name === "AbortError"
        ? "응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요."
        : error instanceof TypeError
          ? "인터넷 연결을 확인한 뒤 다시 시도해 주세요."
          : error.message;
  } finally {
    clearTimeout(timeout);
    renderProjects();
  }
};
retryButton.addEventListener("click", loadProjects);
projectFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-language]");
  if (!button || button.disabled || !projectFilters.contains(button)) return;
  state.language = button.dataset.language;
  renderProjects();
  // 다시 만든 필터에서도 키보드 포커스를 유지한다.
  const selected = [...projectFilters.querySelectorAll("button")].find(
    (item) => item.dataset.language === state.language,
  );
  if (selected) selected.focus();
});
document.querySelectorAll(".github-link").forEach((link) => {
  link.href = `https://github.com/${encodeURIComponent(GITHUB_USERNAME)}`;
});
// 6. 폼 입력 → 유효성 상태 변경 → 오류 메시지 표시
const validateField = (name, value) => {
  const text = value.trim();
  if (!text)
    return {
      name: "이름을 입력해 주세요.",
      email: "이메일을 입력해 주세요.",
      message: "메시지를 입력해 주세요.",
    }[name];
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return "이메일 형식을 확인해 주세요. 예: hello@example.com";
  }
  return "";
};
const renderForm = () => {
  Object.entries(fields).forEach(([name, field]) => {
    document.querySelector(`#${name}-error`).textContent = state.errors[name];
    if (state.errors[name]) field.classList.add("invalid");
    else field.classList.remove("invalid");
    field.setAttribute("aria-invalid", String(Boolean(state.errors[name])));
  });
  formStatus.textContent = state.formMessage;
  formStatus.hidden = !state.formMessage;
};
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  Object.entries(fields).forEach(([name, field]) => {
    state.errors[name] = validateField(name, field.value);
  });
  const firstInvalid = Object.keys(fields).find((name) => state.errors[name]);
  state.formMessage = firstInvalid
    ? ""
    : "입력 확인이 완료됐어요. 학습용 폼으로 실제 메시지는 전송되지 않았습니다.";
  renderForm();
  if (firstInvalid) fields[firstInvalid].focus();
});
contactForm.addEventListener("input", (event) => {
  const { name, value } = event.target;
  if (!Object.hasOwn(fields, name)) return;
  state.errors[name] = validateField(name, value);
  state.formMessage = "";
  renderForm();
});

renderTheme();
renderMenu();
renderScroll();
renderForm();
document.querySelector("#year").textContent = new Date().getFullYear();
handleScroll();
loadProjects();
