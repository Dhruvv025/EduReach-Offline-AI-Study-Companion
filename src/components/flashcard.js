import { db, logStudyActivity } from '../db';

let currentCard = null;
let dueCards = [];

// Initialize flashcard filters and stats
/**
 * Mounts active selectors, flips handlers, and review buttons for flashcards.
 */
export async function initFlashcardTab() {
  const selectFilter = document.getElementById('flashcard-subject-filter');
  if (!selectFilter) return;

  // Render subject list
  const courses = await db.courses.toArray();
  selectFilter.innerHTML = '<option value="all">All Courses</option>';
  courses.forEach(course => {
    selectFilter.innerHTML += `<option value="${course.id}">${course.title}</option>`;
  });

  // Attach filters
  selectFilter.onchange = () => loadDueCards();
  
  // Attach card flip handler
  const innerCard = document.getElementById('flashcard-inner');
  const ratingPanel = document.getElementById('rating-panel');
  
  innerCard.onclick = () => {
    innerCard.classList.toggle('flipped');
    if (innerCard.classList.contains('flipped')) {
      ratingPanel.style.visibility = 'visible';
    } else {
      ratingPanel.style.visibility = 'hidden';
    }
  };

  // Attach rating button event listeners
  const ratingButtons = document.querySelectorAll('.btn-rating');
  ratingButtons.forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation(); // Avoid reflipping card
      const score = parseInt(btn.dataset.score, 10);
      if (currentCard) {
        await rescheduleCard(currentCard.id, score);
        // Log study activity in Dexie
        await logStudyActivity('flashcard');
        innerCard.classList.remove('flipped');
        ratingPanel.style.visibility = 'hidden';
        await loadDueCards(); // Load next due card
      }
    };
  });

  await loadDueCards();
}

// Load due cards and update stats
/**
 * Fetches and displays reviews scheduled for SM-2 repetition today.
 */
export async function loadDueCards() {
  const selectFilter = document.getElementById('flashcard-subject-filter');
  const courseFilter = selectFilter ? selectFilter.value : 'all';
  
  const now = new Date();
  let cards = [];
  
  if (courseFilter === 'all') {
    cards = await db.flashcards.toArray();
  } else {
    cards = await db.flashcards.where('courseId').equals(parseInt(courseFilter, 10)).toArray();
  }

  // Calculate totals
  const totalCount = cards.length;
  dueCards = cards.filter(card => new Date(card.nextReview) <= now);
  
  document.getElementById('total-card-count').innerText = totalCount;
  document.getElementById('due-count').innerText = dueCards.length;

  if (dueCards.length === 0) {
    document.getElementById('no-cards-due').style.display = 'flex';
    document.getElementById('flashcard-active').style.display = 'none';
    currentCard = null;
  } else {
    document.getElementById('no-cards-due').style.display = 'none';
    document.getElementById('flashcard-active').style.display = 'block';
    
    // Select first due card
    currentCard = dueCards[0];
    document.getElementById('card-question').innerText = currentCard.question;
    document.getElementById('card-answer').innerText = currentCard.answer;
  }
}

// SM-2 Spaced Repetition Algorithm
/**
 * Runs the SM-2 algorithm to compute next review intervals.
 * @param {number} cardId - Dexie DB key identifier.
 * @param {number} quality - User response rating (0 to 5).
 */
async function rescheduleCard(cardId, quality) {
  const card = await db.flashcards.get(cardId);
  if (!card) return;

  let { interval, easeFactor, repetitions } = card;

  // SM-2 Calculations
  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  } else {
    // Forgot card, reset interval
    repetitions = 0;
    interval = 1;
  }

  // Adjust Ease Factor (EF)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  // Update card in DB
  await db.flashcards.update(cardId, {
    interval,
    easeFactor,
    repetitions,
    nextReview: nextReviewDate.toISOString()
  });
}
