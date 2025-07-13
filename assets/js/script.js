document.addEventListener('DOMContentLoaded', () => {
    const carouselContainer = document.querySelector('.carousel-container');
    const track = document.querySelector('.carousel-track');
    
    if (!track) return; 
    const originalSlides = Array.from(track.children);
    const carouselNav = document.querySelector('.carousel-nav');
    const dotsTrack = document.querySelector('.dots-track');
    
    if (originalSlides.length <= 1) {
        if (carouselNav) carouselNav.style.display = 'none';
        return;
    }

    let slideWidth = originalSlides[0].getBoundingClientRect().width;
    let currentIndex = 1; 
    let autoScrollInterval;
    let isTransitioning = false;

    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    track.prepend(originalSlides[originalSlides.length - 1].cloneNode(true));
    track.append(originalSlides[0].cloneNode(true));
    const allSlides = Array.from(track.children);

    originalSlides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.dataset.index = index;
        dotsTrack.appendChild(dot);
    });
    const dots = Array.from(dotsTrack.children);

    const getDotMetrics = () => {
        if (!dots.length) return { dotWidth: 0, dotMargin: 0 };
        const rect = dots[0].getBoundingClientRect();
        const style = window.getComputedStyle(dots[0]);
        const dotWidth = rect.width;
        const dotMargin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
        return { dotWidth, dotMargin };
    };

    const setPosition = () => {
        track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
        updateDots();
    };

    const setTrackTransition = (enable) => {
        track.style.transition = enable ? 'transform 0.5s ease-in-out' : 'none';
    };

    const updateDots = () => {
        if (!dots.length) return;
        const { dotWidth, dotMargin } = getDotMetrics();
        const navWidth = carouselNav.getBoundingClientRect().width;
        
        const realIndex = (currentIndex - 1 + originalSlides.length) % originalSlides.length;

        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[realIndex]) {
            dots[realIndex].classList.add('active');
        }

        const offset = (navWidth / 2) - (dotWidth / 2) - (realIndex * (dotWidth + dotMargin));
        dotsTrack.style.transform = `translateX(${offset}px)`;
    };

    const moveToSlide = (targetIndex) => {
        if (isTransitioning) return;
        isTransitioning = true;
        
        currentIndex = targetIndex;
        setTrackTransition(true);
        setPosition();
    };
     
    const checkIndexOnTransitionEnd = () => {
        if (currentIndex === 0) { 
            currentIndex = originalSlides.length;
            setTrackTransition(false);
            setPosition();
        } else if (currentIndex === allSlides.length - 1) { 
            currentIndex = 1;
            setTrackTransition(false);
            setPosition();
        }
        isTransitioning = false; 
    };

    dotsTrack.addEventListener('click', e => {
        const targetDot = e.target.closest('button.carousel-dot');
        if (!targetDot || isTransitioning) return;

        stopAutoScroll();
        const clickedIndex = parseInt(targetDot.dataset.index);
        moveToSlide(clickedIndex + 1); 
        startAutoScroll();
    });

    const getPositionX = (event) => event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    
    const dragStart = (event) => {
        if (isTransitioning) return;
        isDragging = true;
        startPos = getPositionX(event);
        prevTranslate = -slideWidth * currentIndex;
        setTrackTransition(false);
        stopAutoScroll();
    };

    const drag = (event) => {
        if (isDragging) {
            const currentPosition = getPositionX(event);
            currentTranslate = prevTranslate + currentPosition - startPos;
            track.style.transform = `translateX(${currentTranslate}px)`;
        }
    };

    const dragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const movedBy = currentTranslate - prevTranslate;
   
        if (movedBy < -100 && currentIndex < allSlides.length - 1) {
            moveToSlide(currentIndex + 1);
        } else if (movedBy > 100 && currentIndex > 0) {
            moveToSlide(currentIndex - 1);
        } else {
            
            setTrackTransition(true);
            setPosition();
        }
        startAutoScroll();
    };
 
    const startAutoScroll = () => {
        stopAutoScroll(); 
        autoScrollInterval = setInterval(() => moveToSlide(currentIndex + 1), 10000);
    };
    const stopAutoScroll = () => clearInterval(autoScrollInterval);

    const init = () => {
        slideWidth = originalSlides[0].getBoundingClientRect().width;
        currentIndex = 1;
        isTransitioning = false;
        setTrackTransition(false);
        setPosition();
        startAutoScroll();
    };

    track.addEventListener('transitionend', checkIndexOnTransitionEnd);
    carouselContainer.addEventListener('mousedown', dragStart);
    carouselContainer.addEventListener('touchstart', dragStart, { passive: true });
    carouselContainer.addEventListener('mouseup', dragEnd);
    carouselContainer.addEventListener('touchend', dragEnd);
    carouselContainer.addEventListener('mouseleave', dragEnd);
    carouselContainer.addEventListener('mousemove', drag);
    carouselContainer.addEventListener('touchmove', drag, { passive: true });
    window.addEventListener('resize', init);

    init();
});
