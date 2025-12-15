import { db } from '../db';

// State management
let chatHistory = [];
let localEngine = null;
let activeCourseId = null;
let activeLessonIndex = null;

// Track active lesson context (called from main.js)
export function setActiveLessonContext(courseId, lessonIndex) {
  activeCourseId = courseId;
  activeLessonIndex = lessonIndex;
}

// Initialize AI Tutor View logic
/**
 * Binds settings switches, provider selections, and text trigger inputs for the AI Tutor.
 */
export function initAiTutor() {
  const modeSelect = document.getElementById('ai-mode-select');
  const providerSelect = document.getElementById('api-provider');
  const personaSelect = document.getElementById('ai-persona-select');
  const customEndpointGroup = document.getElementById('custom-endpoint-group');
  const cloudSettings = document.getElementById('cloud-settings-group');
  const localSettings = document.getElementById('local-settings-group');
  
  if (!modeSelect || !providerSelect || !personaSelect) return;

  // Toggle Settings Panel based on Mode
  modeSelect.onchange = () => {
    if (modeSelect.value === 'local') {
      cloudSettings.style.display = 'none';
      localSettings.style.display = 'block';
    } else {
      cloudSettings.style.display = 'block';
      localSettings.style.display = 'none';
    }
    saveCredentials();
  };

  // Toggle custom endpoints
  providerSelect.onchange = () => {
    if (providerSelect.value === 'custom') {
      customEndpointGroup.style.display = 'block';
    } else {
      customEndpointGroup.style.display = 'none';
    }
    updateModelDefault();
    saveCredentials();
  };

  personaSelect.onchange = () => {
    saveCredentials();
  };

  // Load saved credentials from LocalStorage
  loadCredentials();

  // Attach button triggers
  document.getElementById('download-model-btn').onclick = () => initLocalWebLLM();
  document.getElementById('send-chat-btn').onclick = () => handleUserSend();
  
  // Add enter key trigger for chat
  document.getElementById('chat-input').onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSend();
    }
  };

  // Preset prompts
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
      const prompt = btn.dataset.prompt;
      document.getElementById('chat-input').value = prompt;
      handleUserSend();
    };
  });
}

// Load default models based on selected API provider
/**
 * Loads standard model identifiers depending on selected cloud provider.
 */
function updateModelDefault() {
  const provider = document.getElementById('api-provider').value;
  const modelInput = document.getElementById('model-name');
  if (provider === 'gemini') {
    modelInput.value = 'gemini-1.5-flash';
  } else if (provider === 'openai') {
    modelInput.value = 'gpt-4o-mini';
  } else if (provider === 'custom') {
    modelInput.value = '';
  }
}

// Save credentials locally
/**
 * Saves selected settings and security key tokens to LocalStorage.
 */
function saveCredentials() {
  localStorage.setItem('er_ai_mode', document.getElementById('ai-mode-select').value);
  localStorage.setItem('er_api_provider', document.getElementById('api-provider').value);
  localStorage.setItem('er_api_key', document.getElementById('api-key').value);
  localStorage.setItem('er_custom_endpoint', document.getElementById('api-endpoint').value);
  localStorage.setItem('er_model_name', document.getElementById('model-name').value);
  localStorage.setItem('er_ai_persona', document.getElementById('ai-persona-select').value);
}

// Load credentials from local storage
/**
 * Restores active configuration keys from local browser cache.
 */
function loadCredentials() {
  const mode = localStorage.getItem('er_ai_mode');
  const provider = localStorage.getItem('er_api_provider');
  const apiKey = localStorage.getItem('er_api_key');
  const endpoint = localStorage.getItem('er_custom_endpoint');
  const modelName = localStorage.getItem('er_model_name');
  const persona = localStorage.getItem('er_ai_persona');

  if (mode) {
    document.getElementById('ai-mode-select').value = mode;
    document.getElementById('ai-mode-select').dispatchEvent(new Event('change'));
  }
  if (provider) {
    document.getElementById('api-provider').value = provider;
    document.getElementById('api-provider').dispatchEvent(new Event('change'));
  }
  if (apiKey) document.getElementById('api-key').value = apiKey;
  if (endpoint) document.getElementById('api-endpoint').value = endpoint;
  if (modelName) document.getElementById('model-name').value = modelName;
  if (persona) document.getElementById('ai-persona-select').value = persona;
}

// Initialize Local WebLLM
async function initLocalWebLLM() {
  const modelSelect = document.getElementById('local-model-select');
  const modelId = modelSelect.value;
  const progressContainer = document.getElementById('model-progress-container');
  const progressFill = document.getElementById('model-progress-fill');
  const progressText = document.getElementById('model-progress-text');
  const downloadBtn = document.getElementById('download-model-btn');

  downloadBtn.disabled = true;
  progressContainer.style.display = 'block';
  progressText.innerText = "Importing WebLLM module...";

  try {
    // Check WebGPU availability
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported by your browser. Please use Chrome/Edge or enable WebGPU.");
    }

    // Dynamic ESM import of MLC WebLLM to avoid bundle bloat
    const webLLM = await import("https://esm.run/@mlc-ai/web-llm");
    
    progressText.innerText = "Downloading model (could take a few minutes)...";

    // Setup engine callbacks
    const initProgressCallback = (report) => {
      const percentage = Math.round(report.progress * 100);
      progressFill.style.width = `${percentage}%`;
      progressText.innerText = `${report.text} (${percentage}%)`;
    };

    localEngine = new webLLM.CreateMLCEngine(modelId, {
      initProgressCallback: initProgressCallback
    });

    await localEngine;
    progressText.innerText = "Model loaded successfully! Ready offline.";
    downloadBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Model Ready';
  } catch (error) {
    console.error(error);
    progressText.innerText = `Error: ${error.message}`;
    downloadBtn.disabled = false;
  }
}

// Handle chat user submit
async function handleUserSend() {
  const inputEl = document.getElementById('chat-input');
  const text = inputEl.value.trim();
  if (!text) return;

  // Clear input
  inputEl.value = '';

  // Append user message
  appendMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  // Show thinking indicator
  const thinkingId = appendMessage('ai', 'Thinking...', true);

  // Save config state
  saveCredentials();

  try {
    const aiMode = document.getElementById('ai-mode-select').value;
    const persona = document.getElementById('ai-persona-select').value;
    let reply = '';

    // Fetch lesson context to append to systemic query
    let contextPrompt = '';
    if (activeCourseId !== null && activeLessonIndex !== null) {
      const course = await db.courses.get(activeCourseId);
      if (course && course.lessons && course.lessons[activeLessonIndex]) {
        const lesson = course.lessons[activeLessonIndex];
        contextPrompt = `\n\n[CONTEXT: Student is currently studying the lesson "${lesson.title}" inside the course "${course.title}". Here is the lesson text: "${lesson.content}"]`;
      }
    }

    // Configure system instructions based on selected Tutor Persona
    let systemInstruction = "You are a helpful, empathetic educational assistant tutor named EduReach. Answer the student's question clearly, step-by-step. Keep definitions simple.";
    
    if (persona === 'socratic') {
      systemInstruction = "You are a helpful, empathetic educational assistant tutor named EduReach. Adopt a Socratic guiding style: do NOT give the direct answer immediately. Instead, explain background concepts step-by-step and ask leading, thought-provoking questions to help the student figure out the answer themselves. Keep responses concise.";
    } else if (persona === 'eli5') {
      systemInstruction = "You are a helpful, empathetic educational assistant tutor named EduReach. Adopt the persona of a friendly teacher explaining concepts to a 10-year-old child. Use simple analogies, avoid complex jargon, and explain concepts using very simple terms. Break explanations into short, friendly paragraphs.";
    } else if (persona === 'examiner') {
      systemInstruction = "You are a strict, professional educational examiner named EduReach. Your role is to test the student's knowledge. Answer questions briefly, but immediately follow up with a challenging multiple-choice or short-answer question based on the topic to quiz the student. Insist on accuracy and evaluate their responses strictly.";
    } else if (persona === 'standard') {
      systemInstruction = "You are a helpful, empathetic educational assistant tutor named EduReach. Explain concepts clearly, step-by-step, using structural lists, definitions, and concise explanations.";
    }

    const systemMessage = systemInstruction + contextPrompt;

    if (aiMode === 'local') {
      if (!localEngine) {
        throw new Error("Local WebLLM is not initialized. Please click 'Initialize & Download Model' first.");
      }

      // Local WebLLM completion
      const messages = [
        { role: 'system', content: systemMessage },
        ...chatHistory
      ];

      const response = await localEngine.chat.completions.create({
        messages: messages
      });
      reply = response.choices[0].message.content;

    } else {
      // Cloud API Router
      const provider = document.getElementById('api-provider').value;
      const apiKey = document.getElementById('api-key').value;
      const customUrl = document.getElementById('api-endpoint').value;
      const model = document.getElementById('model-name').value;

      if (!apiKey) {
        throw new Error("API Key is required for Cloud API mode.");
      }

      let requestUrl = '';
      let headers = {
        'Content-Type': 'application/json'
      };

      if (provider === 'openai') {
        requestUrl = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (provider === 'gemini') {
        requestUrl = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${apiKey}`;
      } else {
        // Custom URL endpoint
        requestUrl = customUrl;
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const body = JSON.stringify({
        model: model || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'),
        messages: [
          { role: 'system', content: systemMessage },
          ...chatHistory
        ],
        temperature: 0.7
      });

      const res = await fetch(requestUrl, {
        method: 'POST',
        headers: headers,
        body: body
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error ${res.status}`);
      }

      const result = await res.json();
      reply = result.choices[0].message.content;
    }

    // Replace thinking message
    removeThinkingMessage(thinkingId);
    appendMessage('ai', reply);
    chatHistory.push({ role: 'assistant', content: reply });

  } catch (error) {
    removeThinkingMessage(thinkingId);
    appendMessage('ai', `Error executing query: ${error.message}`);
    console.error(error);
  }
}

// Append message element to UI
function appendMessage(sender, text, isThinking = false) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const msgId = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5);

  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  messageDiv.id = msgId;

  const iconClass = sender === 'ai' ? 'fa-robot' : 'fa-user';

  // Basic HTML formatting for markdown code blocks, inline code, and lists
  let formattedText = text;
  if (!isThinking) {
    formattedText = text
      .replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  messageDiv.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid ${iconClass}"></i></div>
    <div class="msg-bubble">${isThinking ? '<span class="thinking-dots">...</span>' : formattedText}</div>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return msgId;
}

// Remove thinking indicator
function removeThinkingMessage(msgId) {
  const msgEl = document.getElementById(msgId);
  if (msgEl) msgEl.remove();
}
