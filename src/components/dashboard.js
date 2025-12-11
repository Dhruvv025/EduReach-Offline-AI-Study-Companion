import { db } from '../db';

// Render the entire Student Dashboard
/**
 * Renders the primary student progress dashboard metrics and calendar.
 * @param {Function} onNavigateToTab - Navigational callback.
 * @param {Function} onSelectLesson - Lesson selection callback.
 */
export async function renderDashboard(onNavigateToTab, onSelectLesson) {
  // Update stats counts
  
// Query stats totals from IndexedDB schemas
await updateStats();

  // Render the heatmap
  await renderHeatmap();

  // Render the quick resume learning card
  await renderQuickResume(onNavigateToTab, onSelectLesson);
}

// Update the numerical metrics at the top of the dashboard
/**
 * Recalculates stats values from IndexedDB and updates stats badges.
 */
async function updateStats() {
  const dashStreakEl = document.getElementById('dash-streak');
  const dashLessonsEl = document.getElementById('dash-completed-lessons');
  const dashQuizzesEl = document.getElementById('dash-quizzes-passed');
  const dashCardsDueEl = document.getElementById('dash-cards-due');

  if (!dashStreakEl || !dashLessonsEl || !dashQuizzesEl || !dashCardsDueEl) return;

  // 1. Calculate active study streak
  
// Fetch daily study streaks from activity logs
const streak = await calculateStreak();
  dashStreakEl.innerText = `${streak} Day${streak !== 1 ? 's' : ''}`;

  // 2. Count completed lessons
  const progressList = await db.progress.toArray();
  let completedLessonsCount = 0;
  progressList.forEach(p => {
    if (p.completedLessons) {
      completedLessonsCount += p.completedLessons.length;
    }
  });
  dashLessonsEl.innerText = completedLessonsCount;

  // 3. Count completed quizzes
  let completedQuizzesCount = 0;
  progressList.forEach(p => {
    if (p.quizScores) {
      completedQuizzesCount += Object.keys(p.quizScores).length;
    }
  });
  dashQuizzesEl.innerText = completedQuizzesCount;

  // 4. Count due flashcards today
  const now = new Date();
  const allCards = await db.flashcards.toArray();
  const dueCardsCount = allCards.filter(card => new Date(card.nextReview) <= now).length;
  dashCardsDueEl.innerText = dueCardsCount;
}

// Calculate the consecutive study streak (days with at least one logged activity)
/**
 * Checks IndexedDB logs to compute the consecutive daily study streak.
 * @returns {number} The active streak day count.
 */
export async function calculateStreak() {
  try {
    const logs = await db.studyLog.toArray();
    if (logs.length === 0) return 0;

    // Extract sorted unique dates (YYYY-MM-DD) descending
    
// Retrieve unique dates sorted in descending order
const uniqueDates = [...new Set(logs.map(l => l.date))].sort((a, b) => b.localeCompare(a));

    const todayStr = new Date().toLocaleDateString('sv');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('sv');

    // Check if the user studied today or yesterday. If neither, streak is broken (0).
    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date();

    // If they didn't study today but did study yesterday, start the backtrack from yesterday
    if (!uniqueDates.includes(todayStr) && uniqueDates.includes(yesterdayStr)) {
      checkDate = yesterday;
    }

    while (true) {
      const checkStr = checkDate.toLocaleDateString('sv');
      if (uniqueDates.includes(checkStr)) {
        streak++;
        // Go back one day
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (err) {
    console.error("Error calculating study streak:", err);
    return 0;
  }
}

// Render the 35-day (5 weeks) GitHub-style study heatmap grid
/**
 * Renders the contribution heatmap matrix for the last 35 days.
 */
async function renderHeatmap() {
  const container = document.getElementById('study-heatmap-container');
  if (!container) return;

  container.innerHTML = '';

  try {
    const logs = await db.studyLog.toArray();
    
    // Group logs by YYYY-MM-DD date key
    const logMap = {};
    logs.forEach(l => {
      logMap[l.date] = (logMap[l.date] || 0) + 1;
    });

    const daysTotal = 35; // 5 weeks of data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (daysTotal - 1));

    // Render 5 columns (weeks)
    
// Create 5 grid columns representing weeks
for (let w = 0; w < 5; w++) {
      const colDiv = document.createElement('div');
      colDiv.className = 'heatmap-col';

      // Month label header (only label if month changes or at start of column)
      const colStartDate = new Date(startDate);
      colStartDate.setDate(startDate.getDate() + w * 7);
      
      const colLabel = document.createElement('div');
      colLabel.className = 'heatmap-col-label';
      
      // Determine label text
      const monthStr = colStartDate.toLocaleString('default', { month: 'short' });
      colLabel.innerText = monthStr;
      colDiv.appendChild(colLabel);

      // Render 7 days in this column
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (w * 7 + d));
        
        const dateStr = currentDate.toLocaleDateString('sv'); // YYYY-MM-DD
        const count = logMap[dateStr] || 0;

        // Activity level calculation (0 to 4)
        let level = 0;
        if (count > 0) {
          level = Math.min(4, count);
        }

        const dayBox = document.createElement('div');
        dayBox.className = `heatmap-day lvl-${level}`;
        
        // Tooltip description
        const tooltipDate = currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        dayBox.dataset.tooltip = `${tooltipDate}: ${count} study action${count !== 1 ? 's' : ''}`;
        dayBox.dataset.date = dateStr;

        colDiv.appendChild(dayBox);
      }

      container.appendChild(colDiv);
    }
  } catch (err) {
    console.error("Failed to render heatmap:", err);
    container.innerHTML = '<p class="field-desc" style="padding: 10px;">Failed to load activity heatmap.</p>';
  }
}

// Render the quick resume learning card
async function renderQuickResume(onNavigateToTab, onSelectLesson) {
  const resumeTitleEl = document.getElementById('resume-course-title');
  const resumeLessonEl = document.getElementById('resume-lesson-title');
  const resumeBtn = document.getElementById('resume-study-btn');

  if (!resumeTitleEl || !resumeLessonEl || !resumeBtn) return;

  const lastCourseId = localStorage.getItem('er_last_course_id');
  const lastLessonIndex = localStorage.getItem('er_last_lesson_index');

  if (lastCourseId && lastLessonIndex) {
    try {
      const courseId = parseInt(lastCourseId, 10);
      const lessonIndex = parseInt(lastLessonIndex, 10);

      const course = await db.courses.get(courseId);
      if (course && course.lessons && course.lessons[lessonIndex]) {
        const lesson = course.lessons[lessonIndex];

        resumeTitleEl.innerText = course.title;
        resumeLessonEl.innerText = `Resume at Lesson ${lessonIndex + 1}: "${lesson.title}"`;
        
        resumeBtn.onclick = async () => {
          // Switch to courses tab
          onNavigateToTab('courses-section');
          
          // Wait a tick for tab switch animation to fire, then select the lesson
          setTimeout(() => {
            onSelectLesson(courseId, lessonIndex);
            
            // Expand the course sublist
            const courseCard = document.querySelector(`.list-item-card[data-id="${courseId}"]`);
            if (courseCard) {
              const sublist = courseCard.querySelector('.lesson-sublist');
              if (sublist && sublist.style.display === 'none') {
                courseCard.click();
              }
              
              // Trigger active class highlight
              setTimeout(() => {
                const link = document.querySelector(`.lesson-link[data-index="${lessonIndex}"]`);
                if (link) link.classList.add('active');
              }, 50);
            }
          }, 100);
        };
        return;
      }
    } catch (e) {
      console.error("Error setting up quick resume link:", e);
    }
  }

  // Fallback if no history is logged
  resumeTitleEl.innerText = "Begin your learning journey";
  resumeLessonEl.innerText = "Select a course module from the catalog to start.";
  resumeBtn.onclick = () => {
    onNavigateToTab('courses-section');
  };
}
