# EduReach: Offline-First AI Study Companion & PWA

**EduReach** is a Progressive Web Application (PWA) designed to bridge the digital divide in education. It provides students in low-resource, rural, or offline environments with an interactive, offline-first study portal featuring structured curriculums, spaced-repetition active recall flashcards, progress dashboards, and a WebGPU-enabled local AI tutor.

---

## 🌟 Key Features

### 📡 100% Offline-First Operations
* **IndexedDB Local Storage**: Uses `Dexie.js` to manage all courses, flashcards, study schedules, and progress history locally in the browser cache.
* **Asset Caching**: Service Workers automatically cache application assets (HTML, CSS, JS, fonts, and assets), allowing the portal to boot and run fully offline without network access.
* **Status Monitors**: Dynamic network event listeners display live connectivity status (Online vs Offline).

### 📊 Gamified Student Dashboard
* **Daily Streak Counter**: Tracks your consecutive days of active studying to help build consistent habits.
* **Learning Activity Heatmap**: A GitHub-style contribution calendar displaying your study interactions (lessons read, quizzes taken, flashcards rated) over the last 5 weeks.
* **Resume Learning Launcher**: A quick-resume card that remembers your last active course and lesson, letting you jump back into studying with a single click.

### 🎨 Premium Visual Accent & Theme Configurator
* **Transitions**: Smooth, responsive CSS variables transition animations applied globally to prevent layout flashes.
* **Themes**: Full support for **Dark Mode**, **Light Mode**, **High Contrast Mode** (for visually impaired users), and **System Auto Mode** (which matches your device preferences).
* **Accent Color Picker**: Personalize your portal by choosing between five vibrant, curated colors: **Royal Blue**, **Emerald Green**, **Amethyst Purple**, **Sunset Rose**, and **Amber Gold**.

### 🧠 Spaced-Repetition System (Active Recall)
* Implements the **SuperMemo-2 (SM-2) algorithm** to optimize learning retention.
* Flashcard review schedules adjust dynamically based on user-rated recall quality (0 to 5), ensuring difficult terms are reviewed more frequently than easy ones.

### 🤖 Local & Cloud AI Study Tutor with Personas
* **Local WebLLM Interface**: Integrates WebGPU-based browser inference via `@mlc-ai/web-llm` to load and run lightweight language models (like *Gemma 2B IT*) directly in the browser's web worker. No API costs or internet connection required.
* **Tutor Personas**: Configure the AI tutor's personality to match your study preferences:
  * *Socratic Guide*: Asks guiding, thought-provoking questions to help you solve problems.
  * *Standard Teacher*: Explains concepts clearly and step-by-step.
  * *ELI5 Assistant*: Explains complex ideas simply, using child-friendly analogies.
  * *Strict Examiner*: Quizzes your knowledge and evaluates answers strictly.
* **Cloud Fallback API**: Connects to OpenAI, Google Gemini, or custom endpoints (e.g. OpenRouter, Ollama) using locally-saved API keys.

### 🛠️ In-App Course Creator & Exporter
* A visual form wizard that allows teachers and students to create customized courses.
* Add, edit, and delete lessons (Markdown supported), quizzes (multiple choice with index answers and explanations), and flashcards.
* **Export JSON**: Download your custom course as a structured `.json` file that matches the EduReach curriculum schema.
* **Save to Library**: Instantly load your course into the portal's IndexedDB library.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, Vanilla ES6+ JS (ES Modules), CSS3 Variables
* **Database Layer**: Dexie.js (Wrapper for IndexedDB)
* **Local Inference**: MLC-AI WebLLM (WebGPU browser execution)
* **Build System**: Vite 5

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18 or 20+ recommended)
* `npm` or `yarn`

### Installation & Run

1. Clone this repository:
   ```bash
   git clone https://github.com/Dhruvv025/EduReach-Offline-AI-Study-Companion.git
   cd EduReach-Offline-AI-Study-Companion
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the local development server:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000/](http://localhost:3000/)** in your web browser.

4. Build the production package (compiles assets into `dist/` directory):
   ```bash
   npm run build
   ```

---

## 📂 Curriculum JSON Schema

EduReach courses are defined using lightweight JSON objects. Here is an example of the expected structure (an example file is available at `/public/courses/history_sample.json`):

```json
{
  "title": "History: The Printing Press",
  "description": "Discover how Johannes Gutenberg's invention revolutionized communication and accelerated the spread of knowledge.",
  "subject": "History",
  "difficulty": "Intermediate",
  "lessons": [
    {
      "title": "The Invention of Movable Type",
      "content": "Before the mid-15th century, books in Europe were copied by hand..."
    }
  ],
  "quizzes": [
    {
      "question": "Who is credited with inventing movable type printing in Europe?",
      "options": ["Martin Luther", "Johannes Gutenberg", "Galileo Galilei", "Leonardo da Vinci"],
      "answer": 1,
      "explanation": "Johannes Gutenberg, a German goldsmith, invented the movable metal type press around 1440."
    }
  ],
  "flashcards": [
    {
      "question": "In what decade did Gutenberg develop movable type in Europe?",
      "answer": "1440s."
    }
  ]
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.




## 🔍 Troubleshooting WebGPU
* Ensure you are running Chrome or Edge version 113+.
* Verify that hardware acceleration is enabled in your browser settings.
* Visit [chrome://gpu](chrome://gpu) to check WebGPU state.