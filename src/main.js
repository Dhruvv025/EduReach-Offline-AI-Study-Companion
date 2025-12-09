import { db, seedDatabase, logStudyActivity } from './db';
import { renderCourseList, loadLessonContent } from './components/courseList';
import { initFlashcardTab, loadDueCards } from './components/flashcard';
import { renderQuizList } from './components/quiz';
import { initAiTutor, setActiveLessonContext } from './components/aiTutor';
import { renderDashboard } from './components/dashboard';
import { initCourseCreator } from './components/courseCreator';

// Setup global app state
let activeCourseId = null;
let activeLessonIndex = null;

// Bootstrap application on page load
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Initial Seeding of Database
  const dbStatusEl = document.getElementById('db-status');
  try {
    
// Launch async seeding script for indexeddb tables
await seedDatabase();
    if (dbStatusEl) dbStatusEl.innerText = 'Connected';
  } catch (error) {
    console.error("Database initialization failed", error);
    if (dbStatusEl) dbStatusEl.innerText = 'Initialization Error';
  }

  // 2. Setup PWA Service Worker Caching
  
// Start service worker caching lifecycle for assets
registerServiceWorker();

  // 3. Setup Network listeners
  initNetworkStatus();

  // 4. Initialize Settings Menu (Themes & Accent Colors)
  
// Load saved themes and accent colors on reload
initThemes();

  // 5. Initialize Tabs & Navigation
  
// Mount triggers on tabs selectors buttons
initTabs();

  // 6. Initialize Student Dashboard
  await renderDashboard(navigateToTab, onSelectLesson);

  // 7. Initialize course list and reading panel
  await renderCourseList(onSelectLesson);

  // 8. Initialize Flashcard spaced repetition page
  await initFlashcardTab();

  // 9. Initialize Quiz lists
  await renderQuizList();

  // 10. Initialize AI Tutor panel
  initAiTutor();

  // 11. Initialize visual Course Creator
  initCourseCreator(async () => {
    // Callback when a new course is successfully saved locally
    await renderCourseList(onSelectLesson);
    await renderQuizList();
    await initFlashcardTab();
    await renderDashboard(navigateToTab, onSelectLesson);
  });

  // 12. File Uploader listener for custom courses
  initCourseUploader();
});

// Programmatic tab navigation
/**
 * Navigates to a specific UI section programmatically and handles hot module loads.
 * @param {string} targetTabId - DOM ID of the tab section element.
 */
export function navigateToTab(targetTabId) {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    if (btn.dataset.target === targetTabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  tabContents.forEach(tab => {
    if (tab.id === targetTabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Refresh tab specific modules
  if (targetTabId === 'flashcards-section') {
    loadDueCards(); // Refresh SRS counts
  } else if (targetTabId === 'dashboard-section') {
    renderDashboard(navigateToTab, onSelectLesson);
  }
}

// Set up UI tab button triggers
/**
 * Configures click listeners on navigation bar button elements.
 */
function initTabs() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navigateToTab(btn.dataset.target);
    });
  });
}

// Light / Dark / High Contrast Theme & Primary Accent customizer
/**
 * Sets up listeners for the theme dropdown selection and color accent pickers.
 */
function initThemes() {
  const settingsBtn = document.getElementById('settings-toggle-btn');
  const settingsMenu = document.getElementById('settings-menu');
  const themeSelect = document.getElementById('app-theme-select');
  const accentBtns = document.querySelectorAll('.accent-color-btn');

  if (!settingsBtn || !settingsMenu || !themeSelect) return;

  // Toggle settings dropdown panel
  settingsBtn.onclick = (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('show');
  };

  // Click outside menu closes dropdown
  document.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
      settingsMenu.classList.remove('show');
    }
  });

  // Load and apply theme
  const savedTheme = localStorage.getItem('er_theme') || 'dark';
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);

  themeSelect.onchange = () => {
    const selected = themeSelect.value;
    localStorage.setItem('er_theme', selected);
    applyTheme(selected);
  };

  // Load and apply accent colors
  const savedAccent = localStorage.getItem('er_accent') || 'blue';
  applyAccent(savedAccent);

  accentBtns.forEach(btn => {
    btn.onclick = () => {
      const accent = btn.dataset.accent;
      localStorage.setItem('er_accent', accent);
      applyAccent(accent);
    };
  });
}

/**
 * Applies selected theme attributes (dark, light, contrast) to the root element.
 * @param {string} theme - The theme configuration name.
 */
function applyTheme(theme) {
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Bind global listener to system theme switches if not present
    if (!window.erSystemThemeListener) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('er_theme') === 'system') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
      window.erSystemThemeListener = true;
    }
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function applyAccent(accent) {
  const html = document.documentElement;
  // Remove existing accent classes
  html.classList.remove('accent-blue', 'accent-emerald', 'accent-amethyst', 'accent-rose', 'accent-amber');
  // Add selected accent class
  html.classList.add(`accent-${accent}`);

  // Reflect active accent colors in meta themes
  const accentHexMap = {
    blue: '#3b82f6',
    emerald: '#10b981',
    amethyst: '#8b5cf6',
    rose: '#f43f5e',
    amber: '#f59e0b'
  };
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', accentHexMap[accent] || '#3b82f6');
  }

  // Highlight active button in accent picker list
  const accentBtns = document.querySelectorAll('.accent-color-btn');
  accentBtns.forEach(btn => {
    if (btn.dataset.accent === accent) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// PWA Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registered successfully!', reg.scope))
        .catch(err => console.error('Service Worker registration failed:', err));
    });
  }
}

// Network Status Listeners
function initNetworkStatus() {
  const indicator = document.getElementById('offline-indicator');
  const statusText = indicator?.querySelector('.status-text');
  const netStatusEl = document.getElementById('net-status');

  const updateStatus = () => {
    if (navigator.onLine) {
      if (indicator) {
        indicator.className = 'status-badge online';
        if (statusText) statusText.innerText = 'Online';
      }
      if (netStatusEl) netStatusEl.innerText = 'Online';
    } else {
      if (indicator) {
        indicator.className = 'status-badge offline';
        if (statusText) statusText.innerText = 'Offline';
      }
      if (netStatusEl) netStatusEl.innerText = 'Offline';
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus(); // run initial check
}

// Selection callback for lessons
async function onSelectLesson(courseId, lessonIndex) {
  activeCourseId = courseId;
  activeLessonIndex = lessonIndex;
  
  // Track last lesson history for quick resume
  localStorage.setItem('er_last_course_id', courseId);
  localStorage.setItem('er_last_lesson_index', lessonIndex);

  // Set context for AI Tutor queries
  setActiveLessonContext(courseId, lessonIndex);

  // Load lesson markup
  await loadLessonContent(courseId, lessonIndex, onProgressUpdated);

  // Refresh dashboard metrics
  await renderDashboard(navigateToTab, onSelectLesson);
}

// Progression change callback
async function onProgressUpdated(courseId, lessonIndex) {
  // Log study activity in Dexie
  await logStudyActivity('lesson');

  // Re-render course catalogs and progress counts
  await renderCourseList(onSelectLesson);

  // Refresh dashboard metrics
  await renderDashboard(navigateToTab, onSelectLesson);
}

// Dynamic Course Upload parsing JSON
function initCourseUploader() {
  const fileInput = document.getElementById('import-course-input');
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const courseData = JSON.parse(evt.target.result);

        // Basic schema validations
        if (!courseData.title || !courseData.lessons || !Array.isArray(courseData.lessons)) {
          throw new Error("Invalid course schema: 'title' and an array of 'lessons' are required.");
        }

        // Add course to IndexedDB
        const newCourseId = await db.courses.add({
          title: courseData.title,
          description: courseData.description || 'Custom uploaded course.',
          subject: courseData.subject || 'General',
          difficulty: courseData.difficulty || 'Intermediate',
          lessons: courseData.lessons,
          quizzes: courseData.quizzes || []
        });

        // Add associated flashcards if supplied
        if (courseData.flashcards && Array.isArray(courseData.flashcards)) {
          const formattedCards = courseData.flashcards.map(card => ({
            courseId: newCourseId,
            question: card.question,
            answer: card.answer,
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReview: new Date().toISOString()
          }));
          await db.flashcards.bulkAdd(formattedCards);
        }

        // Initialize progress tracker
        await db.progress.add({
          courseId: newCourseId,
          completedLessons: [],
          quizScores: {}
        });

        alert(`Successfully imported "${courseData.title}"!`);

        // Reload views
        await renderCourseList(onSelectLesson);
        await initFlashcardTab();
        await renderQuizList();
        await renderDashboard(navigateToTab, onSelectLesson);
        
      } catch (err) {
        alert(`Failed to import course: ${err.message}`);
        console.error(err);
      }
    };
    reader.readAsText(file);
    fileInput.value = ''; // Reset uploader input
  });
}
