import { db } from '../db';

// Course Creator State
let courseLessons = [];
let courseQuizzes = [];
let courseFlashcards = [];

// Initialize Course Creator wizard and form controls
export function initCourseCreator(onCourseCreated) {
  // Lessons Form
  const addLessonBtn = document.getElementById('creator-add-lesson-btn');
  if (addLessonBtn) {
    addLessonBtn.onclick = () => addLesson();
  }

  // Quizzes Form
  const addQuizBtn = document.getElementById('creator-add-quiz-btn');
  if (addQuizBtn) {
    addQuizBtn.onclick = () => addQuiz();
  }

  // Flashcards Form
  const addFcBtn = document.getElementById('creator-add-fc-btn');
  if (addFcBtn) {
    addFcBtn.onclick = () => addFlashcard();
  }

  // Footer Actions
  const clearBtn = document.getElementById('creator-clear-btn');
  if (clearBtn) {
    clearBtn.onclick = () => resetCreatorForm();
  }

  const exportBtn = document.getElementById('creator-export-btn');
  if (exportBtn) {
    exportBtn.onclick = () => exportCourseJSON();
  }

  const saveBtn = document.getElementById('creator-save-btn');
  if (saveBtn) {
    saveBtn.onclick = () => saveCourseToLibrary(onCourseCreated);
  }

  // Initial draw
  renderAllLists();
}

// Add a lesson to local state
function addLesson() {
  const titleEl = document.getElementById('creator-lesson-title');
  const contentEl = document.getElementById('creator-lesson-content');

  if (!titleEl || !contentEl) return;

  const title = titleEl.value.trim();
  const content = contentEl.value.trim();

  if (!title || !content) {
    alert("Please enter both a lesson title and content.");
    return;
  }

  courseLessons.push({ title, content });

  // Clear inputs
  titleEl.value = '';
  contentEl.value = '';

  renderAllLists();
}

// Add a quiz question to local state
function addQuiz() {
  const questionEl = document.getElementById('creator-quiz-question');
  const optionEls = document.querySelectorAll('.quiz-creator-opt');
  const correctEl = document.getElementById('creator-quiz-correct');
  const explEl = document.getElementById('creator-quiz-expl');

  if (!questionEl || optionEls.length === 0 || !correctEl || !explEl) return;

  const question = questionEl.value.trim();
  const explanation = explEl.value.trim();
  const answer = parseInt(correctEl.value, 10);

  if (!question) {
    alert("Please enter a quiz question.");
    return;
  }

  // Retrieve and validate options
  const options = [];
  optionEls.forEach((opt, idx) => {
    const val = opt.value.trim();
    options.push(val || `Option ${idx + 1}`);
  });

  courseQuizzes.push({
    question,
    options,
    answer,
    explanation
  });

  // Clear inputs
  questionEl.value = '';
  optionEls.forEach(opt => opt.value = '');
  correctEl.selectedIndex = 0;
  explEl.value = '';

  renderAllLists();
}

// Add a flashcard to local state
function addFlashcard() {
  const questionEl = document.getElementById('creator-fc-question');
  const answerEl = document.getElementById('creator-fc-answer');

  if (!questionEl || !answerEl) return;

  const question = questionEl.value.trim();
  const answer = answerEl.value.trim();

  if (!question || !answer) {
    alert("Please fill in both the flashcard question (front) and answer (back).");
    return;
  }

  courseFlashcards.push({ question, answer });

  // Clear inputs
  questionEl.value = '';
  answerEl.value = '';

  renderAllLists();
}

// Render lessons, quizzes, and flashcard badges lists
function renderAllLists() {
  // Update Counts
  document.getElementById('creator-lessons-count').innerText = courseLessons.length;
  document.getElementById('creator-quizzes-count').innerText = courseQuizzes.length;
  document.getElementById('creator-flashcards-count').innerText = courseFlashcards.length;

  // 1. Render Lessons List
  const lessonsList = document.getElementById('creator-lessons-list');
  lessonsList.innerHTML = '';
  courseLessons.forEach((l, index) => {
    lessonsList.appendChild(createItemBadge(`${index + 1}. ${l.title}`, () => {
      courseLessons.splice(index, 1);
      renderAllLists();
    }));
  });

  // 2. Render Quizzes List
  const quizzesList = document.getElementById('creator-quizzes-list');
  quizzesList.innerHTML = '';
  courseQuizzes.forEach((q, index) => {
    quizzesList.appendChild(createItemBadge(`${index + 1}. ${q.question.substring(0, 30)}...`, () => {
      courseQuizzes.splice(index, 1);
      renderAllLists();
    }));
  });

  // 3. Render Flashcards List
  const flashcardsList = document.getElementById('creator-flashcards-list');
  flashcardsList.innerHTML = '';
  courseFlashcards.forEach((f, index) => {
    flashcardsList.appendChild(createItemBadge(`Q: ${f.question.substring(0, 30)}...`, () => {
      courseFlashcards.splice(index, 1);
      renderAllLists();
    }));
  });
}

// Helper to create a list item badge with a delete button
function createItemBadge(labelText, onDeleteClick) {
  const badge = document.createElement('div');
  badge.className = 'creator-item-badge';

  const textNode = document.createElement('span');
  textNode.innerText = labelText;
  badge.appendChild(textNode);

  const actions = document.createElement('div');
  actions.className = 'creator-item-actions';

  const delBtn = document.createElement('button');
  delBtn.className = 'btn-icon-danger';
  delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  delBtn.onclick = (e) => {
    e.stopPropagation();
    onDeleteClick();
  };

  actions.appendChild(delBtn);
  badge.appendChild(actions);

  return badge;
}

// Reset the entire wizard state
function resetCreatorForm() {
  if (confirm("Are you sure you want to reset and clear all inputs?")) {
    courseLessons = [];
    courseQuizzes = [];
    courseFlashcards = [];

    // Clear main inputs
    document.getElementById('create-course-title').value = '';
    document.getElementById('create-course-subject').value = '';
    document.getElementById('create-course-difficulty').selectedIndex = 1;
    document.getElementById('create-course-desc').value = '';

    renderAllLists();
  }
}

// Compile the JSON payload and validate
function compileCourseData() {
  const title = document.getElementById('create-course-title').value.trim();
  const subject = document.getElementById('create-course-subject').value.trim() || 'General';
  const difficulty = document.getElementById('create-course-difficulty').value;
  const description = document.getElementById('create-course-desc').value.trim() || 'Custom course module.';

  if (!title) {
    alert("Course Title is required.");
    return null;
  }

  if (courseLessons.length === 0) {
    alert("Please add at least one lesson before exporting or saving.");
    return null;
  }

  return {
    title,
    description,
    subject,
    difficulty,
    lessons: courseLessons,
    quizzes: courseQuizzes,
    flashcards: courseFlashcards
  };
}

// Export the compiled data as a .json file download
function exportCourseJSON() {
  const courseData = compileCourseData();
  if (!courseData) return;

  try {
    const jsonString = JSON.stringify(courseData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    // Format title into clean snake_case filename
    const filename = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_course.json';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(`Failed to export course JSON: ${err.message}`);
  }
}

// Save the course directly to the local IndexedDB database
async function saveCourseToLibrary(onCourseCreated) {
  const courseData = compileCourseData();
  if (!courseData) return;

  try {
    // 1. Add course metadata and lessons to database
    const courseId = await db.courses.add({
      title: courseData.title,
      description: courseData.description,
      subject: courseData.subject,
      difficulty: courseData.difficulty,
      lessons: courseData.lessons,
      quizzes: courseData.quizzes
    });

    // 2. Add flashcards if present
    if (courseData.flashcards && courseData.flashcards.length > 0) {
      const formattedCards = courseData.flashcards.map(card => ({
        courseId,
        question: card.question,
        answer: card.answer,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: new Date().toISOString()
      }));
      await db.flashcards.bulkAdd(formattedCards);
    }

    // 3. Setup initial progress log
    await db.progress.add({
      courseId,
      completedLessons: [],
      quizScores: {}
    });

    alert(`Successfully added course "${courseData.title}" to your library!`);

    // Reset forms
    courseLessons = [];
    courseQuizzes = [];
    courseFlashcards = [];
    document.getElementById('create-course-title').value = '';
    document.getElementById('create-course-subject').value = '';
    document.getElementById('create-course-difficulty').selectedIndex = 1;
    document.getElementById('create-course-desc').value = '';
    renderAllLists();

    // Trigger callback to refresh other UI components
    if (onCourseCreated) {
      await onCourseCreated();
    }
  } catch (err) {
    alert(`Failed to save course: ${err.message}`);
    console.error(err);
  }
}
