import { db } from '../db';

// Render the course directory sidebar list
/**
 * Renders list items and completion badges in the courses sidebar.
 * @param {Function} onSelectLesson - Navigation selection trigger.
 */
export async function renderCourseList(onSelectLesson) {
  const container = document.getElementById('course-list-container');
  if (!container) return;

  container.innerHTML = ''; // Clear previous

  const courses = await db.courses.toArray();
  const progressList = await db.progress.toArray();

  if (courses.length === 0) {
    container.innerHTML = '<p class="field-desc" style="padding: 10px;">No courses available. Import a course JSON to begin.</p>';
    return;
  }

  for (const course of courses) {
    const courseProgress = progressList.find(p => p.courseId === course.id) || { completedLessons: [] };
    const totalLessons = course.lessons ? course.lessons.length : 0;
    const completedCount = courseProgress.completedLessons ? courseProgress.completedLessons.length : 0;

    const courseCard = document.createElement('div');
    courseCard.className = 'list-item-card';
    courseCard.dataset.id = course.id;
    
    courseCard.innerHTML = `
      <h4>${course.title}</h4>
      <p>${course.description || ''}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <span class="badge">${course.difficulty}</span>
        <span class="field-desc" style="font-weight:600;">${completedCount}/${totalLessons} Done</span>
      </div>
      <div class="lesson-sublist" id="lessons-for-${course.id}" style="display: none;"></div>
    `;

    // Toggle lesson expansion on click
    courseCard.addEventListener('click', (e) => {
      // Don't toggle expansion if clicking on a specific sub-lesson item
      if (e.target.closest('.lesson-link')) return;

      const sublist = courseCard.querySelector('.lesson-sublist');
      const allSublists = document.querySelectorAll('.lesson-sublist');
      
      // Close other sublists, open this one
      allSublists.forEach(el => {
        if (el !== sublist) el.style.display = 'none';
      });

      if (sublist.style.display === 'none') {
        sublist.style.display = 'flex';
        renderSubLessons(course, courseProgress, sublist, onSelectLesson);
      } else {
        sublist.style.display = 'none';
      }
    });

    container.appendChild(courseCard);
  }
}

// Render lessons nested inside a course list item
/**
 * Renders sub lessons links list inside course container elements.
 * @param {Object} course - The course catalog entry.
 * @param {Object} progress - Course progress levels.
 * @param {HTMLElement} container - The nested list target.
 * @param {Function} onSelectLesson - Lesson link callback.
 */
function renderSubLessons(course, progress, container, onSelectLesson) {
  container.innerHTML = '';
  
  if (!course.lessons || course.lessons.length === 0) {
    container.innerHTML = '<span class="field-desc">No lessons in this course.</span>';
    return;
  }

  course.lessons.forEach((lesson, index) => {
    const isCompleted = progress.completedLessons && progress.completedLessons.includes(index);
    const lessonLink = document.createElement('div');
    lessonLink.className = `lesson-link ${isCompleted ? 'completed' : ''}`;
    lessonLink.dataset.index = index;
    lessonLink.innerHTML = `
      <span>${index + 1}. ${lesson.title}</span>
      <i class="fa-solid ${isCompleted ? 'fa-circle-check' : 'fa-circle-notch'}"></i>
    `;

    lessonLink.addEventListener('click', () => {
      // Clear active states and highlight this one
      document.querySelectorAll('.lesson-link').forEach(el => el.classList.remove('active'));
      lessonLink.classList.add('active');
      
      onSelectLesson(course.id, index);
    });

    container.appendChild(lessonLink);
  });
}

// Render the active lesson into the reading panel
export async function loadLessonContent(courseId, lessonIndex, onProgressUpdated) {
  const course = await db.courses.get(courseId);
  if (!course || !course.lessons || !course.lessons[lessonIndex]) return;

  const lesson = course.lessons[lessonIndex];
  
  // Show reader wrappers
  document.getElementById('no-lesson-selected').style.display = 'none';
  const wrapper = document.getElementById('lesson-content-wrapper');
  wrapper.style.display = 'flex';

  // Set Title and Progress
  document.getElementById('lesson-title').innerText = lesson.title;
  document.getElementById('lesson-progress-badge').innerText = `Lesson ${lessonIndex + 1} of ${course.lessons.length}`;

  // Simple Markdown parsing for headers, bold text and newlines
  let formattedContent = lesson.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/### (.*?)\n/g, '<h4>$1</h4>')
    .replace(/## (.*?)\n/g, '<h3>$1</h3>')
    .replace(/\n\n/g, '<br><br>');

  document.getElementById('lesson-body').innerHTML = formattedContent;

  // Retrieve user progress
  let progressRecord = await db.progress.where('courseId').equals(courseId).first();
  if (!progressRecord) {
    progressRecord = { courseId, completedLessons: [], quizScores: {} };
    await db.progress.add(progressRecord);
  }

  const isCompleted = progressRecord.completedLessons.includes(lessonIndex);
  const completeBtn = document.getElementById('complete-lesson-btn');
  
  if (isCompleted) {
    completeBtn.className = 'btn btn-secondary';
    completeBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Mark as Uncompleted';
  } else {
    completeBtn.className = 'btn btn-success';
    completeBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Complete Lesson';
  }

  // Set up click handler for the complete button
  completeBtn.onclick = async () => {
    let freshProgress = await db.progress.where('courseId').equals(courseId).first();
    if (!freshProgress) return;

    if (freshProgress.completedLessons.includes(lessonIndex)) {
      // Unmark
      freshProgress.completedLessons = freshProgress.completedLessons.filter(idx => idx !== lessonIndex);
    } else {
      // Mark complete
      freshProgress.completedLessons.push(lessonIndex);
    }
    
    await db.progress.update(freshProgress.id, { completedLessons: freshProgress.completedLessons });
    
    // Trigger callbacks to refresh sidebars and update UI state
    onProgressUpdated(courseId, lessonIndex);
  };

  // Setup previous and next buttons
  const prevBtn = document.getElementById('prev-lesson-btn');
  const nextBtn = document.getElementById('next-lesson-btn');

  prevBtn.disabled = lessonIndex === 0;
  nextBtn.disabled = lessonIndex === course.lessons.length - 1;

  prevBtn.onclick = () => {
    const prevLink = document.querySelector(`.lesson-link[data-index="${lessonIndex - 1}"]`);
    if (prevLink) prevLink.click();
  };

  nextBtn.onclick = () => {
    const nextLink = document.querySelector(`.lesson-link[data-index="${lessonIndex + 1}"]`);
    if (nextLink) nextLink.click();
  };
}
