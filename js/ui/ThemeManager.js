class ThemeManager {
  constructor() {
    this.themeKey = 'music_website_theme'
    this.themeToggleBtn = null
  }

  initialize() {
    this.themeToggleBtn = document.getElementById('themeToggleBtn')
    const savedTheme = localStorage.getItem(this.themeKey)
    
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode')
      this.updateButton('☀️', '切换到白天模式')
    } else {
      document.body.classList.remove('dark-mode')
      this.updateButton('🌙', '切换到黑夜模式')
    }
  }

  toggle() {
    const isDarkMode = document.body.classList.toggle('dark-mode')
    
    if (isDarkMode) {
      localStorage.setItem(this.themeKey, 'dark')
      this.updateButton('☀️', '切换到白天模式')
    } else {
      localStorage.setItem(this.themeKey, 'light')
      this.updateButton('🌙', '切换到黑夜模式')
    }
  }

  updateButton(text, title) {
    if (this.themeToggleBtn) {
      this.themeToggleBtn.textContent = text
      this.themeToggleBtn.title = title
    }
  }

  bindEvents(callback) {
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', callback)
    }
  }
}
