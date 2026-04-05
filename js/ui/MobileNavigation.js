class MobileNavigation {
  constructor() {
    this.init();
  }

  init() {
    this.setupNavigation();
  }

  setupNavigation() {
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const desktopNavItems = document.querySelectorAll('.nav-item');

    mobileNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.navigateTo(page, mobileNavItems, desktopNavItems);
      });
    });
  }

  navigateTo(page, mobileItems, desktopItems) {
    mobileItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    desktopItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    document.querySelectorAll('.page').forEach(pageSection => {
      pageSection.classList.remove('active');
    });

    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
      targetPage.classList.add('active');
    }
  }
}
