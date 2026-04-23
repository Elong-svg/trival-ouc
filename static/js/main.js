import storage from './storage.js';
import sidebar from './sidebar.js';
import chat from './chat.js';

class App {
  constructor() {
    this.userInput = document.getElementById('user-input');
    this.sendBtn = document.getElementById('send-btn');
    this.welcomePage = document.getElementById('welcome-page');
    this.selectedSubjects = [];
    this.thinkingEnabled = false; // 思考开关状态，默认关闭
    this.uploadedImages = []; // 已上传的图片数组
    this.uploadedFiles = []; // 已上传的文件数组
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
    this.initThinkingToggle();
    this.initImageUpload();
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

  initThinkingToggle() {
    const thinkingBtn = document.getElementById('thinking-toggle-btn');
    if (!thinkingBtn) return;

    thinkingBtn.addEventListener('click', () => {
      this.thinkingEnabled = !this.thinkingEnabled;
      thinkingBtn.classList.toggle('active', this.thinkingEnabled);
      console.log(`[DEBUG] 深度思考: ${this.thinkingEnabled ? '已开启' : '已关闭'}`);
    });
  }

  initImageUpload() {
    const moreBtn = document.getElementById('more-btn');
    const moreMenu = document.getElementById('more-menu');
    const menuImage = document.getElementById('more-menu-image');
    const menuFile = document.getElementById('more-menu-file');
    const imageInput = document.getElementById('image-input');
    const fileInput = document.getElementById('file-input');
    
    if (!moreBtn || !moreMenu) return;

    // 点击更多按钮显示/隐藏菜单
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moreMenu.classList.toggle('show');
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', () => {
      moreMenu.classList.remove('show');
    });

    // 点击图片选项
    if (menuImage && imageInput) {
      menuImage.addEventListener('click', () => {
        moreMenu.classList.remove('show');
        imageInput.click();
      });
    }

    // 点击文件选项
    if (menuFile && fileInput) {
      menuFile.addEventListener('click', () => {
        moreMenu.classList.remove('show');
        fileInput.click();
      });
    }

    // 监听图片文件选择
    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        this.handleImageFiles(files);
        imageInput.value = '';
      });
    }

    // 监听文档文件选择
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        this.handleFileUpload(files);
        fileInput.value = '';
      });
    }

    // 支持拖拽上传
    const inputWrapper = document.querySelector('.input-wrapper');
    if (inputWrapper) {
      inputWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        inputWrapper.style.outline = '2px dashed var(--blue-500)';
      });

      inputWrapper.addEventListener('dragleave', () => {
        inputWrapper.style.outline = '';
      });

      inputWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        inputWrapper.style.outline = '';
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        const docFiles = files.filter(f => 
          ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'].includes(f.type) ||
          ['.pdf', '.docx', '.txt', '.md'].some(ext => f.name.toLowerCase().endsWith(ext))
        );
        
        if (imageFiles.length > 0) this.handleImageFiles(imageFiles);
        if (docFiles.length > 0) this.handleFileUpload(docFiles);
      });
    }
  }

  async handleFileUpload(files) {
    for (const file of files) {
      if (this.uploadedFiles.length >= 3) {
        chat.showToast('最多上传 3 个文件');
        break;
      }

      // 验证文件类型
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
      const allowedExts = ['.pdf', '.docx', '.txt', '.md'];
      const isValidType = allowedTypes.includes(file.type) || allowedExts.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValidType) {
        chat.showToast('仅支持 PDF、Word、TXT、MD 文件');
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        chat.showToast('文件大小不能超过 20MB');
        continue;
      }

      try {
        chat.showToast('正在解析文件...');
        
        // 上传文件到后端
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || '文件处理失败');
        }
        
        const fileData = {
          file: file,
          filename: result.filename,
          fileType: result.file_type,
          content: result.content,
          length: result.length
        };
        
        this.uploadedFiles.push(fileData);
        this.renderAttachments();
        chat.showToast('文件解析成功！');
        
      } catch (error) {
        console.error('文件上传失败:', error);
        chat.showToast(error.message || '文件上传失败');
      }
    }
  }

  async handleImageFiles(files) {
    for (const file of files) {
      if (this.uploadedImages.length >= 5) {
        chat.showToast('最多上传 5 张图片');
        break;
      }

      if (!file.type.startsWith('image/')) {
        chat.showToast('请上传图片文件');
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        chat.showToast('图片大小不能超过 10MB');
        continue;
      }

      try {
        const base64 = await this.fileToBase64(file);
        const imageData = {
          file: file,
          base64: base64,
          name: file.name
        };
        this.uploadedImages.push(imageData);
        this.renderAttachments();
      } catch (error) {
        console.error('图片处理失败:', error);
        chat.showToast('图片处理失败');
      }
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  renderAttachments() {
    const container = document.getElementById('attachment-area');
    if (!container) return;

    let html = '';
    
    // 渲染图片附件
    this.uploadedImages.forEach((img, index) => {
      html += `
        <div class="attachment-item" data-type="image" data-index="${index}">
          <div class="attachment-image-wrapper">
            <img src="${img.base64}" alt="${img.name}">
            <button class="attachment-remove" data-type="image" data-index="${index}" title="移除图片">×</button>
          </div>
          <div class="attachment-action" data-action="explain" data-type="image" data-index="${index}">
            <span>解释图片</span>
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      `;
    });
    
    // 渲染文件附件
    this.uploadedFiles.forEach((file, index) => {
      const icon = this.getFileIcon(file.fileType);
      html += `
        <div class="attachment-item" data-type="file" data-index="${index}">
          <div class="attachment-file-wrapper">
            <div class="attachment-file-icon">
              ${icon}
            </div>
            <div class="attachment-file-info">
              <div class="attachment-file-name">${file.filename}</div>
              <div class="attachment-file-size">${this.formatFileSize(file.file.size)}</div>
            </div>
          </div>
          <div class="attachment-action" data-action="read" data-type="file" data-index="${index}">
            <span>阅读文件</span>
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <button class="attachment-remove" data-type="file" data-index="${index}" title="移除文件">×</button>
        </div>
      `;
    });

    container.innerHTML = html;

    // 绑定移除事件
    container.querySelectorAll('.attachment-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const index = parseInt(btn.dataset.index);
        if (type === 'image') {
          this.removeImage(index);
        } else {
          this.removeFile(index);
        }
      });
    });

    // 绑定解释图片按钮
    container.querySelectorAll('.attachment-action[data-action="explain"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const img = this.uploadedImages[index];
        if (img) {
          this.userInput.value = `请帮我解释这张图片：${img.name}`;
          this.autoResizeTextarea();
          this.updateSendButtonState();
        }
      });
    });

    // 绑定阅读文件按钮
    container.querySelectorAll('.attachment-action[data-action="read"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const file = this.uploadedFiles[index];
        if (file) {
          this.userInput.value = `请帮我阅读并解读这个${file.fileType.toUpperCase()}文件：${file.filename}`;
          this.autoResizeTextarea();
          this.updateSendButtonState();
        }
      });
    });

    // 更新发送按钮状态
    this.updateSendButtonState();
  }

  getFileIcon(fileType) {
    const icons = {
      pdf: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#EF4444" stroke-width="2"/>
              <path d="M14 2v6h6M8 13h8M8 17h8" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
      docx: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#3B82F6" stroke-width="2"/>
              <path d="M14 2v6h6M8 13h8M8 17h8" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
      txt: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#6B7280" stroke-width="2"/>
              <path d="M14 2v6h6M8 13h8M8 17h8" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
      md: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#6B7280" stroke-width="2"/>
              <path d="M14 2v6h6M8 13h8M8 17h8" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
            </svg>`
    };
    return icons[fileType] || icons.txt;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeFile(index) {
    this.uploadedFiles.splice(index, 1);
    this.renderAttachments();
  }

  clearFiles() {
    this.uploadedFiles = [];
    this.renderAttachments();
  }

  removeImage(index) {
    this.uploadedImages.splice(index, 1);
    this.renderAttachments();
  }

  clearImages() {
    this.uploadedImages = [];
    this.renderAttachments();
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
    if ((text || this.uploadedImages.length > 0 || this.uploadedFiles.length > 0) && !chat.isWaiting) {
      chat.sendMessage(text);
      this.userInput.value = '';
      this.clearImages(); // 发送后清除图片
      this.clearFiles(); // 发送后清除文件
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
    const hasImages = this.uploadedImages.length > 0;
    const hasFiles = this.uploadedFiles.length > 0;
    const hasContent = hasText || hasImages || hasFiles;
    
    if (chat.isWaiting) {
      this.sendBtn.className = 'send-btn loading';
      this.sendBtn.disabled = true;
      this.sendBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="12 12"/>
        </svg>
      `;
    } else if (hasContent) {
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
