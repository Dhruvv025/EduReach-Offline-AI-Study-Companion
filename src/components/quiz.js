import { db, logStudyActivity } from '../db';

let activeQuiz = null;
let currentQuestionIndex = 0;
let score = 0;

// Initialize Quiz Directory List
export async function renderQuizList() {
  const container = document.getElementById('quiz-list-container');
  if (!container) return;

  container.innerHTML = ''; // Clear previous

  const courses = await db.courses.toArray();

  if (courses.length === 0) {
    container.innerHTML = '<p class="field-desc" style="padding: 10px;">No quizzes available.</p>';
    return;
  }

  courses.forEach(course => {
    // Check if course has quiz questions
    if (!course.quizzes || course.quizzes.length === 0) return;

    const quizCard = document.createElement('div');
    quizCard.className = 'list-item-card';
    quizCard.dataset.id = course.id;
    
    quizCard.innerHTML = `
      <h4>${course.title} Quiz</h4>
      <p>${course.quizzes.length} Questions &bull; Quiz Section</p>
    `;

    quizCard.onclick = () => {
      document.querySelectorAll('#quiz-list-container .list-item-card').forEach(el => el.classList.remove('active'));
      quizCard.classList.add('active');
      startQuiz(course);
    };

    container.appendChild(quizCard);
  });
}

// Start active quiz session
function startQuiz(course) {
  activeQuiz = course;
  currentQuestionIndex = 0;
  score = 0;

  // Swap panels
  document.getElementById('no-quiz-selected').style.display = 'none';
  document.getElementById('quiz-active').style.display = 'block';
  document.getElementById('quiz-results').style.display = 'none';
  document.getElementById('quiz-feedback').style.display = 'none';

  document.getElementById('quiz-course-title').innerText = `${course.title} Quiz`;

  loadQuestion();
}

// Load current question in arena
function loadQuestion() {
  if (!activeQuiz) return;
  const questions = activeQuiz.quizzes;
  const question = questions[currentQuestionIndex];

  // Hide feedback, update score trackers
  document.getElementById('quiz-feedback').style.display = 'none';
  document.getElementById('quiz-score-tracker').innerText = `Score: ${score}/${currentQuestionIndex}`;
  
  // Update progress bar
  const progressPercent = (currentQuestionIndex / questions.length) * 100;
  document.getElementById('quiz-progress-fill').style.width = `${progressPercent}%`;

  document.getElementById('quiz-question-num').innerText = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  document.getElementById('quiz-question-text').innerText = question.question;

  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = ''; // Clear previous options

  question.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'btn-option';
    btn.innerHTML = `<span>${option}</span>`;

    btn.onclick = () => handleAnswer(index, btn);
    optionsContainer.appendChild(btn);
  });
}

// Check selected option
async function handleAnswer(selectedIndex, selectedBtn) {
  if (!activeQuiz) return;
  const questions = activeQuiz.quizzes;
  const question = questions[currentQuestionIndex];

  // Disable all options
  const optionButtons = document.querySelectorAll('#quiz-options .btn-option');
  optionButtons.forEach(btn => btn.disabled = true);

  const isCorrect = selectedIndex === question.answer;
  if (isCorrect) {
    score++;
    selectedBtn.classList.add('correct');
    selectedBtn.innerHTML += ' <i class="fa-solid fa-check" style="color:var(--color-success);"></i>';
  } else {
    selectedBtn.classList.add('incorrect');
    selectedBtn.innerHTML += ' <i class="fa-solid fa-xmark" style="color:var(--color-danger);"></i>';
    
    // Highlight correct one
    optionButtons[question.answer].classList.add('correct');
    optionButtons[question.answer].innerHTML += ' <i class="fa-solid fa-check" style="color:var(--color-success);"></i>';
  }

  // Render Explanations
  const feedbackPanel = document.getElementById('quiz-feedback');
  const feedbackTitle = document.getElementById('feedback-title');
  const feedbackExpl = document.getElementById('feedback-explanation');
  const nextBtn = document.getElementById('quiz-next-btn');

  if (isCorrect) {
    feedbackTitle.innerHTML = '<i class="fa-solid fa-check-circle"></i> Correct!';
    feedbackTitle.style.color = 'var(--color-success)';
    feedbackPanel.style.borderLeftColor = 'var(--color-success)';
  } else {
    feedbackTitle.innerHTML = '<i class="fa-solid fa-times-circle"></i> Incorrect';
    feedbackTitle.style.color = 'var(--color-danger)';
    feedbackPanel.style.borderLeftColor = 'var(--color-danger)';
  }

  feedbackExpl.innerText = question.explanation || '';
  feedbackPanel.style.display = 'block';

  // Increment question count
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    nextBtn.innerHTML = 'Next Question <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.onclick = () => loadQuestion();
  } else {
    nextBtn.innerHTML = 'View Results <i class="fa-solid fa-trophy"></i>';
    nextBtn.onclick = () => displayResults();
  }
}

// Show quiz results screen
async function displayResults() {
  document.getElementById('quiz-feedback').style.display = 'none';
  document.getElementById('quiz-options').innerHTML = ''; // Clear options
  document.getElementById('quiz-progress-fill').style.width = '100%';
  document.getElementById('quiz-score-tracker').innerText = `Score: ${score}/${activeQuiz.quizzes.length}`;

  const resultsScreen = document.getElementById('quiz-results');
  resultsScreen.style.display = 'flex';

  const percent = Math.round((score / activeQuiz.quizzes.length) * 100);
  document.getElementById('quiz-final-score').innerText = `Your Score: ${percent}% (${score}/${activeQuiz.quizzes.length})`;

  let comment = '';
  if (percent === 100) comment = 'Perfect score! Incredibly done!';
  else if (percent >= 80) comment = 'Excellent job! You have mastered this module.';
  else if (percent >= 50) comment = 'Good effort! Read the lessons again to improve your score.';
  else comment = 'Keep studying! Check out the flashcards to help memorize the terms.';

  document.getElementById('quiz-performance-comment').innerText = comment;

  // Save Quiz Score in DB
  let progressRecord = await db.progress.where('courseId').equals(activeQuiz.id).first();
  if (progressRecord) {
    if (!progressRecord.quizScores) progressRecord.quizScores = {};
    progressRecord.quizScores[activeQuiz.id] = score;
    await db.progress.update(progressRecord.id, { quizScores: progressRecord.quizScores });
  }

  // Log study activity in Dexie
  await logStudyActivity('quiz');

  // Setup Actions
  document.getElementById('quiz-retry-btn').onclick = () => startQuiz(activeQuiz);
  document.getElementById('quiz-exit-btn').onclick = () => {
    document.getElementById('quiz-active').style.display = 'none';
    document.getElementById('no-quiz-selected').style.display = 'flex';
    document.querySelectorAll('#quiz-list-container .list-item-card').forEach(el => el.classList.remove('active'));
    activeQuiz = null;
  };
}
