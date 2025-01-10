import Lenis from 'https://cdn.skypack.dev/lenis';

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
    
    //const firstImageRect = firstImage.getBoundingClientRect();
    const secondImageRect = secondImage.getBoundingClientRect();
    const lastImageRect = lastImage.getBoundingClientRect();

    // Calculate visibility thresholds
    const hasPassedFirstImage = secondImageRect.left <= window.innerWidth;
    const isNearEnd = lastImageRect.right <= window.innerWidth * 1.5;

    // Set initial visibility to none
    if (!hasPassedFirstImage && !isNearEnd) {
        galleryIndex.style.opacity = '0';
        galleryIndex.style.visibility = 'hidden';
    } else {
        galleryIndex.style.visibility = 'visible';
        
        if (hasPassedFirstImage && !isNearEnd) {
            // Fade in after first image
            const opacity = Math.min(1, (window.innerWidth - secondImageRect.left) / window.innerWidth);
            galleryIndex.style.opacity = opacity;
            
            // Rotate the gallery index with smoothing
            rotationAngle += settings.rotationSpeed;
            currentRotation = lerp(currentRotation, rotationAngle, settings.rotationLerp);
            galleryIndex.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
        } else if (isNearEnd) {
            // Fade out near the end
            const opacity = Math.max(0, (lastImageRect.right - window.innerWidth) / (window.innerWidth * 0.5));
            galleryIndex.style.opacity = opacity;
        }
    }

    // Update scale effect for each image
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
    
    // Set initial state to hidden
    container.style.opacity = '0';
    container.style.visibility = 'hidden';
    container.style.transform = 'translate(-50%, -50%) rotate(0deg)';

    // Clear the container
    container.innerHTML = '';

    // Create index items for the gallery
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

        // Calculate position on circle
        const angle = (i / totalSlides) * 2 * Math.PI;
        const radius = settings.radius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

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