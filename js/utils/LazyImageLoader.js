class LazyImageLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin || '100px 0px',
      threshold: options.threshold || 0.01,
      placeholder: options.placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="20" text-anchor="middle" x="200" y="210"%3E加载中...%3C/text%3E%3C/svg%3E',
      errorPlaceholder: options.errorPlaceholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23ffebee" width="400" height="400"/%3E%3Ctext fill="%23c62828" font-family="Arial" font-size="20" text-anchor="middle" x="200" y="210"%3E加载失败%3C/text%3E%3C/svg%3E',
      ...options
    };
    
    this.observer = null;
    this.loadedImages = new Set();
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          rootMargin: this.options.rootMargin,
          threshold: this.options.threshold
        }
      );
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }

  loadImage(img) {
    if (this.loadedImages.has(img)) {
      return;
    }

    const dataSrc = img.dataset.src || img.dataset.lazy;
    if (!dataSrc) {
      return;
    }

    const tempImg = new Image();
    
    tempImg.onload = () => {
      img.src = dataSrc;
      img.classList.add('lazy-loaded');
      img.classList.remove('lazy-loading');
      this.loadedImages.add(img);
    };

    tempImg.onerror = () => {
      img.src = this.options.errorPlaceholder;
      img.classList.add('lazy-error');
      img.classList.remove('lazy-loading');
      console.error('图片加载失败:', dataSrc);
    };

    tempImg.src = dataSrc;
  }

  observe(img) {
    if (!img.dataset.src && !img.dataset.lazy) {
      return;
    }

    if (img.src === this.options.placeholder || !img.src) {
      img.src = this.options.placeholder;
    }

    img.classList.add('lazy-loading');

    if (this.observer) {
      this.observer.observe(img);
    } else {
      this.loadImage(img);
    }
  }

  observeAll(selector = 'img[data-src], img[data-lazy]') {
    const images = document.querySelectorAll(selector);
    images.forEach(img => this.observe(img));
  }

  unobserve(img) {
    if (this.observer) {
      this.observer.unobserve(img);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.loadedImages.clear();
  }

  refresh() {
    this.observeAll();
  }
}

const lazyImageLoader = new LazyImageLoader();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LazyImageLoader, lazyImageLoader };
}
