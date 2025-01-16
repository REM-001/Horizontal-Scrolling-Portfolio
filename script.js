let lenis;
let rotationAngle = 0;
let currentRotation = 0;

const archive = {
    element: document.querySelector('.archive'),
    figures: document.querySelectorAll('.archive_slider_figure'),
};

const settings = {
    get center() {
        return window.innerWidth / 2;
    },
    scaleFactor: 1.5,
    lerpFactor: 0.5,
    mobileBreakpoint: 768,
    rotationSpeed: 0.2,
    rotationLerp: 0.08,
    get radius() {
        return window.innerWidth <= 768 ? 75 : 130;
    }
};

const figureScales = new Map();

const initLenis = () => {
    lenis = new Lenis({
        orientation: 'horizontal',
        content: archive.element,
        lerp: 0.05,
        smoothWheel: true,
        touchMultiplier: window.innerWidth <= settings.mobileBreakpoint ? 2 : 1,
        wheelMultiplier: window.innerWidth <= settings.mobileBreakpoint ? 2 : 1,
    });
    
    lenis.on('scroll', handleLenisScroll);

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.scrollTo(0, 0);
};

const handleLenisScroll = () => {
    const firstImage = archive.figures[0];
    const secondImage = archive.figures[1];
    const lastImage = archive.figures[archive.figures.length - 1];
    const galleryIndex = document.querySelector('.gallery-index-curved');

    const secondImageRect = secondImage.getBoundingClientRect();
    const lastImageRect = lastImage.getBoundingClientRect();

    const hasPassedFirstImage = secondImageRect.left <= window.innerWidth;
    const isNearEnd = lastImageRect.right <= window.innerWidth * 1.5;
    const hasReachedEnd = lastImageRect.right <= window.innerWidth;

    if (!hasPassedFirstImage || hasReachedEnd) {
        galleryIndex.classList.remove('visible');
    } else {
        galleryIndex.classList.add('visible');

        if (hasPassedFirstImage && !isNearEnd) {
            rotationAngle += settings.rotationSpeed;
            currentRotation = lerp(currentRotation, rotationAngle, settings.rotationLerp);
            galleryIndex.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
        }
    }

    archive.figures.forEach((figure) => {
        const image = figure.querySelector('.archive_slider_image');
        const figureRect = figure.getBoundingClientRect();

        const distanceFromCenter = Math.abs(figureRect.left + figureRect.width / 2 - settings.center);
        const targetScale = settings.scaleFactor - ((settings.center - distanceFromCenter) / settings.center) * (settings.scaleFactor - 1);
        const clampedScale = Math.max(1, targetScale);
        const previousScale = figureScales.get(figure) || 1;
        const smoothedScale = lerp(previousScale, clampedScale, 0.1);

        image.style.transform = `scale(${smoothedScale})`;
        figureScales.set(figure, smoothedScale);
    });

    updateGalleryIndex();
};

const initCurvedGalleryIndex = () => {
    const container = document.querySelector('.gallery-index-curved');
    const totalSlides = archive.figures.length;
    
    container.classList.remove('visible');
    container.style.transform = 'translate(-50%, -50%) rotate(0deg)';
    container.innerHTML = '';

    archive.figures.forEach((figure, i) => {
        const indexItem = document.createElement('div');
        indexItem.className = 'index-item';

        const imageContainer = document.createElement('div');
        imageContainer.className = 'index-image-container';

        const mainImage = figure.querySelector('.archive_slider_image');
        const indexImage = mainImage.cloneNode(true);
        indexImage.className = 'index-image';

        imageContainer.appendChild(indexImage);
        indexItem.appendChild(imageContainer);

        const angle = (i / totalSlides) * 2 * Math.PI;
        const x = Math.cos(angle) * settings.radius;
        const y = Math.sin(angle) * settings.radius;

        indexItem.style.transform = `translate(${x}px, ${y}px)`;

        indexItem.addEventListener('click', () => {
            updateActiveThumbnail(i);
            const targetScroll = figure.offsetLeft;
            lenis.scrollTo(targetScroll, { duration: 1.2 });
        });

        container.appendChild(indexItem);
    });

    updateActiveThumbnail(0);
    updateGalleryIndex();
};

const updateActiveThumbnail = (activeIndex) => {
    const items = document.querySelectorAll('.index-item');
    items.forEach((item, index) => {
        if (index === activeIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
};

const updateGalleryIndex = () => {
    const indexItems = document.querySelectorAll('.index-item');
    
    archive.figures.forEach((figure, index) => {
        const figureRect = figure.getBoundingClientRect();
        const distanceFromCenter = Math.abs(figureRect.left + figureRect.width / 2 - settings.center);
        const isCentered = distanceFromCenter < (figureRect.width * 0.2);
        
        if (isCentered && indexItems[index]) {
            indexItems.forEach(item => item.classList.remove('active'));
            indexItems[index].classList.add('active');
        }
    });
};

const adjustGallerySize = () => {
    const container = document.querySelector('.gallery-index-curved');
    const items = container.querySelectorAll('.index-item');
    const totalSlides = items.length;
    const radius = settings.radius;

    items.forEach((item, i) => {
        const angle = (i / totalSlides) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        item.style.transform = `translate(${x}px, ${y}px)`;
    });
};

function lerp(start, end, duration) {
    return start + (end - start) * duration;
}

window.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initCurvedGalleryIndex();
    updateGalleryIndex();
});

window.addEventListener('resize', () => {
    adjustGallerySize();
    updateGalleryIndex();
});