import storage from './storage.js';
import sidebar from './sidebar.js';
import chat from './chat.js';

class App {
  constructor() {
    this.userInput = document.getElementById('user-input');
    this.sendBtn = document.getElementById('send-btn');
    this.welcomePage = document.getElementById('welcome-page');
    this.selectedSubjects = [];
  }

  async init() {
    try {
      await storage.init();
      sidebar.init();
      chat.init();
      this.bindEvents();
      this.updateSendButtonState();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  bindEvents() {
    this.userInput.addEventListener('input', () => {
      this.autoResizeTextarea();
      this.updateSendButtonState();
    });

    this.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.sendBtn.addEventListener('click', () => {
      this.handleSend();
    });

    const quickCards = document.querySelectorAll('.quick-prompt-card');
    quickCards.forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.dataset.prompt;
        if (prompt) {
          this.userInput.value = prompt;
          this.handleSend();
        }
      });
    });

    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const prompts = [
          '请介绍一下你自己，你能帮我做什么？',
          '帮我规划一条海大校园游览路线',
          '推荐一些海大的研学资源'
        ];
        this.userInput.value = prompts[index] || '请介绍一下海大';
        this.handleSend();
      });
    });

    this.initAgeSelector();
    this.initVideoModal();
    this.initVoiceInput();
    this.initSubjectSelector();
  }

  initSubjectSelector() {
    const popup = document.getElementById('subject-popup');
    const highSchoolOption = document.querySelector('.age-option[data-value="high_school"]');
    const options = document.querySelectorAll('.subject-option');
    const confirmBtn = document.getElementById('subject-confirm');
    const countDisplay = document.querySelector('.subject-count-display');

    if (!popup || !highSchoolOption) return;

    let hideTimeout = null;

    const showPopup = () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      popup.classList.add('show');
    };

    const hidePopup = () => {
      hideTimeout = setTimeout(() => {
        popup.classList.remove('show');
      }, 100);
    };

    highSchoolOption.addEventListener('mouseenter', () => {
      showPopup();
    });

    highSchoolOption.addEventListener('mouseleave', () => {
      hidePopup();
    });

    popup.addEventListener('mouseenter', () => {
      showPopup();
    });

    popup.addEventListener('mouseleave', () => {
      hidePopup();
    });

    options.forEach(option => {
      option.addEventListener('click', () => {
        const subject = option.dataset.subject;
        
        if (option.classList.contains('selected')) {
          this.selectedSubjects = this.selectedSubjects.filter(s => s !== subject);
          option.classList.remove('selected');
        } else if (this.selectedSubjects.length < 3) {
          this.selectedSubjects.push(subject);
          option.classList.add('selected');
        }

        this.updateSubjectUI();
      });
    });

    confirmBtn.addEventListener('click', () => {
      if (this.selectedSubjects.length === 3) {
        confirmBtn.textContent = '✓ 已确认';
        confirmBtn.disabled = true;
        options.forEach(opt => {
          if (!this.selectedSubjects.includes(opt.dataset.subject)) {
            opt.classList.add('disabled');
          }
        });
        this.updateSelectedSubjectsDisplay();
        window.dispatchEvent(new CustomEvent('subjectsConfirmed', { 
          detail: { subjects: this.selectedSubjects } 
        }));
      }
    });

    const skipBtn = document.getElementById('subject-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.resetSubjectSelection();
        const popup = document.getElementById('subject-popup');
        if (popup) {
          popup.classList.remove('show');
        }
      });
    }
  }

  updateSubjectUI() {
    const confirmBtn = document.getElementById('subject-confirm');
    const countDisplay = document.querySelector('.subject-count-display');
    const options = document.querySelectorAll('.subject-option');

    if (!confirmBtn || !countDisplay) return;

    countDisplay.textContent = `已选 ${this.selectedSubjects.length}/3`;
    
    if (this.selectedSubjects.length === 3) {
      countDisplay.classList.add('complete');
      confirmBtn.disabled = false;
      options.forEach(opt => {
        if (!this.selectedSubjects.includes(opt.dataset.subject)) {
          opt.classList.add('disabled');
        } else {
          opt.classList.remove('disabled');
        }
      });
    } else {
      countDisplay.classList.remove('complete');
      confirmBtn.disabled = true;
      options.forEach(opt => {
        opt.classList.remove('disabled');
      });
    }
  }

  updateSelectedSubjectsDisplay() {
    const display = document.getElementById('selected-subjects-display');
    const wrapper = document.getElementById('age-selector');
    if (!display) return;

    if (this.selectedSubjects.length === 3) {
      display.innerHTML = '';
      this.selectedSubjects.forEach((subject) => {
        const tag = document.createElement('span');
        tag.className = 'subject-tag';
        tag.textContent = subject;
        display.appendChild(tag);
      });
      display.classList.add('show');
      if (wrapper) wrapper.classList.add('has-subjects');
    } else {
      display.classList.remove('show');
      if (wrapper) wrapper.classList.remove('has-subjects');
    }
  }

  resetSubjectSelection() {
    this.selectedSubjects = [];
    
    const options = document.querySelectorAll('.subject-option');
    const confirmBtn = document.getElementById('subject-confirm');
    const countDisplay = document.querySelector('.subject-count-display');
    
    if (options) {
      options.forEach(opt => {
        opt.classList.remove('selected', 'disabled');
      });
    }
    
    if (confirmBtn) {
      confirmBtn.textContent = '确认选择';
      confirmBtn.disabled = true;
    }
    
    if (countDisplay) {
      countDisplay.textContent = '已选 0/3';
      countDisplay.classList.remove('complete');
    }
    
    this.updateSelectedSubjectsDisplay();
  }

  getSelectedSubjects() {
    return this.selectedSubjects;
  }

  initVoiceInput() {
    const voiceBtn = document.getElementById('voice-btn');
    if (!voiceBtn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      voiceBtn.style.display = 'none';
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    let isRecording = false;

    voiceBtn.addEventListener('click', () => {
      if (isRecording) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });

    recognition.onstart = () => {
      isRecording = true;
      voiceBtn.classList.add('recording');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.userInput.value += transcript;
      this.autoResizeTextarea();
      this.updateSendButtonState();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isRecording = false;
      voiceBtn.classList.remove('recording');
    };

    recognition.onend = () => {
      isRecording = false;
      voiceBtn.classList.remove('recording');
    };
  }

  initVideoModal() {
    const videoNav = document.getElementById('video-nav');
    const modal = document.getElementById('video-modal');
    const closeBtn = document.getElementById('modal-close');
    const video = document.getElementById('promo-video');

    if (!videoNav || !modal || !closeBtn || !video) return;

    videoNav.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      setTimeout(() => video.play(), 300);
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => {
        video.pause();
        video.currentTime = 0;
      }, 300);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('video-modal-backdrop')) {
        modal.classList.remove('active');
        setTimeout(() => {
          video.pause();
          video.currentTime = 0;
        }, 300);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
        setTimeout(() => {
          video.pause();
          video.currentTime = 0;
        }, 300);
      }
    });
  }

  initAgeSelector() {
    const selector = document.getElementById('age-selector');
    const trigger = document.getElementById('age-trigger');
    const dropdown = document.getElementById('age-dropdown');
    const display = document.getElementById('age-display');
    const select = document.getElementById('age-group');
    const options = dropdown.querySelectorAll('.age-option');

    if (!selector || !trigger || !dropdown) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      selector.classList.toggle('open');
    });

    options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = option.dataset.value;
        const text = option.textContent;

        options.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');

        display.textContent = text;
        if (select) {
          select.value = value;
        }

        if (value !== 'high_school') {
          this.resetSubjectSelection();
        }

        selector.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!selector.contains(e.target)) {
        selector.classList.remove('open');
      }
    });
  }

  handleSend() {
    const text = this.userInput.value.trim();
    if (text && !chat.isWaiting) {
      chat.sendMessage(text);
      this.userInput.value = '';
      this.autoResizeTextarea();
      this.updateSendButtonState();
    }
  }

  autoResizeTextarea() {
    this.userInput.style.height = 'auto';
    this.userInput.style.height = Math.min(this.userInput.scrollHeight, 160) + 'px';
  }

  updateSendButtonState() {
    const hasText = this.userInput.value.trim().length > 0;
    
    if (chat.isWaiting) {
      this.sendBtn.className = 'send-btn loading';
      this.sendBtn.disabled = true;
      this.sendBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="12 12"/>
        </svg>
      `;
    } else if (hasText) {
      this.sendBtn.className = 'send-btn active';
      this.sendBtn.disabled = false;
      this.sendBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 10l14-7-7 14-2-5-5-2z" fill="currentColor"/>
        </svg>
      `;
    } else {
      this.sendBtn.className = 'send-btn';
      this.sendBtn.disabled = true;
      this.sendBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 10l14-7-7 14-2-5-5-2z" fill="currentColor"/>
        </svg>
      `;
    }
  }
}

const app = new App();
app.init();
window.app = app;
