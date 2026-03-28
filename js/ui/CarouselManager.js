class CarouselManager {
  constructor() {
    this.currentIndex = 0
    this.autoPlay = true
    this.autoPlayInterval = 5000
    this.interval = null
    this.isDragging = false
    this.startX = 0
    this.currentX = 0
    this.track = null
    this.items = []
  }

  initialize() {
    this.track = document.querySelector('.carousel-track')
    if (!this.track) return
    
    this.items = Array.from(this.track.children)
    this.bindEvents()
    this.startAutoPlay()
  }

  bindEvents() {
    this.track.addEventListener('mousedown', (e) => this.startDrag(e))
    this.track.addEventListener('touchstart', (e) => this.startDrag(e))
    
    document.addEventListener('mousemove', (e) => this.drag(e))
    document.addEventListener('touchmove', (e) => this.drag(e))
    
    document.addEventListener('mouseup', () => this.endDrag())
    document.addEventListener('touchend', () => this.endDrag())
    
    const prevBtn = document.querySelector('.carousel-prev')
    const nextBtn = document.querySelector('.carousel-next')
    
    if (prevBtn) prevBtn.addEventListener('click', () => this.prev())
    if (nextBtn) nextBtn.addEventListener('click', () => this.next())
    
    const dots = document.querySelectorAll('.carousel-dot')
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goTo(index))
    })
  }

  startDrag(e) {
    this.isDragging = true
    this.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
    this.track.style.transition = 'none'
    this.stopAutoPlay()
  }

  drag(e) {
    if (!this.isDragging) return
    this.currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    const diff = this.currentX - this.startX
    const offset = -this.currentIndex * 100 + (diff / this.track.offsetWidth * 100)
    this.track.style.transform = `translateX(${offset}%)`
  }

  endDrag() {
    if (!this.isDragging) return
    this.isDragging = false
    this.track.style.transition = 'transform 0.5s ease'
    
    const diff = this.currentX - this.startX
    if (Math.abs(diff) > 100) {
      if (diff > 0) {
        this.prev()
      } else {
        this.next()
      }
    } else {
      this.updatePosition()
    }
    
    this.startAutoPlay()
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.items.length
    this.updatePosition()
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length
    this.updatePosition()
  }

  goTo(index) {
    this.currentIndex = index
    this.updatePosition()
  }

  updatePosition() {
    if (!this.track) return
    this.track.style.transform = `translateX(-${this.currentIndex * 100}%)`
    this.updateDots()
  }

  updateDots() {
    const dots = document.querySelectorAll('.carousel-dot')
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex)
    })
  }

  startAutoPlay() {
    if (!this.autoPlay) return
    this.stopAutoPlay()
    this.interval = setInterval(() => this.next(), this.autoPlayInterval)
  }

  stopAutoPlay() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  refresh() {
    this.currentIndex = 0
    this.updatePosition()
  }
}
