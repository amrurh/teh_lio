document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const carouselContainer = document.querySelector('.carousel-container');
    const track = document.querySelector('.carousel-track');
    // Ensure track exists before proceeding
    if (!track) return; 
    const originalSlides = Array.from(track.children);
    const carouselNav = document.querySelector('.carousel-nav');
    const dotsTrack = document.querySelector('.dots-track');

    // Hide navigation if there's only one slide or it doesn't exist
    if (originalSlides.length <= 1) {
        if (carouselNav) carouselNav.style.display = 'none';
        return;
    }

    // --- State Variables ---
    let slideWidth = originalSlides[0].getBoundingClientRect().width;
    let currentIndex = 1; // Start on the first "real" slide for the infinite loop logic
    let autoScrollInterval;
    let isTransitioning = false;

    // Dragging State
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    // --- Setup: Cloning Slides for Infinite Loop Effect ---
    // Prepend the last slide and append the first slide to the track
    track.prepend(originalSlides[originalSlides.length - 1].cloneNode(true));
    track.append(originalSlides[0].cloneNode(true));
    const allSlides = Array.from(track.children);

    // --- Setup: Navigation Dots ---
    // Create one dot for each of the original slides
    originalSlides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.dataset.index = index;
        dotsTrack.appendChild(dot);
    });
    const dots = Array.from(dotsTrack.children);

    // --- Core Functions ---

    // Function to get dot dimensions for centering logic
    const getDotMetrics = () => {
        if (!dots.length) return { dotWidth: 0, dotMargin: 0 };
        const rect = dots[0].getBoundingClientRect();
        const style = window.getComputedStyle(dots[0]);
        const dotWidth = rect.width;
        const dotMargin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
        return { dotWidth, dotMargin };
    };

    // Sets the track's position based on the current index
    const setPosition = () => {
        track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
        updateDots();
    };

    // Enables or disables the CSS transition on the track
    const setTrackTransition = (enable) => {
        track.style.transition = enable ? 'transform 0.5s ease-in-out' : 'none';
    };

    // Updates the dots to reflect the current slide and centers the active dot
    const updateDots = () => {
        if (!dots.length) return;
        const { dotWidth, dotMargin } = getDotMetrics();
        const navWidth = carouselNav.getBoundingClientRect().width;
        // Calculate the real index (e.g., 0, 1, or 2 for 3 slides) from the track's current index
        const realIndex = (currentIndex - 1 + originalSlides.length) % originalSlides.length;

        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[realIndex]) {
            dots[realIndex].classList.add('active');
        }

        // Calculate the offset to center the active dot
        const offset = (navWidth / 2) - (dotWidth / 2) - (realIndex * (dotWidth + dotMargin));
        dotsTrack.style.transform = `translateX(${offset}px)`;
    };

    // Moves the carousel to a specific slide index
    const moveToSlide = (targetIndex) => {
        if (isTransitioning) return;
        isTransitioning = true;
        
        currentIndex = targetIndex;
        setTrackTransition(true);
        setPosition();
    };
    
    // --- Event Handlers ---

    // Handles the "jump" for the infinite loop after a transition ends
    const checkIndexOnTransitionEnd = () => {
        if (currentIndex === 0) { // Jump from cloned last slide to the real one
            currentIndex = originalSlides.length;
            setTrackTransition(false);
            setPosition();
        } else if (currentIndex === allSlides.length - 1) { // Jump from cloned first slide to the real one
            currentIndex = 1;
            setTrackTransition(false);
            setPosition();
        }
        isTransitioning = false; // Re-enable interaction
    };

    // Handles clicks on the navigation dots
    dotsTrack.addEventListener('click', e => {
        const targetDot = e.target.closest('button.carousel-dot');
        if (!targetDot || isTransitioning) return;

        stopAutoScroll();
        const clickedIndex = parseInt(targetDot.dataset.index);
        moveToSlide(clickedIndex + 1); // +1 because of the cloned slide at the beginning
        startAutoScroll();
    });

    // --- Drag/Touch Logic ---
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

        // Move to the next or previous slide if dragged far enough
        if (movedBy < -100 && currentIndex < allSlides.length - 1) {
            moveToSlide(currentIndex + 1);
        } else if (movedBy > 100 && currentIndex > 0) {
            moveToSlide(currentIndex - 1);
        } else {
            // Snap back to the current slide if drag was not sufficient
            setTrackTransition(true);
            setPosition();
        }
        startAutoScroll();
    };

    // --- Autoscroll ---
    const startAutoScroll = () => {
        stopAutoScroll(); // Prevent multiple intervals
        autoScrollInterval = setInterval(() => moveToSlide(currentIndex + 1), 4000);
    };
    const stopAutoScroll = () => clearInterval(autoScrollInterval);

    // --- Initialization ---
    const init = () => {
        slideWidth = originalSlides[0].getBoundingClientRect().width;
        currentIndex = 1;
        isTransitioning = false;
        setTrackTransition(false);
        setPosition();
        startAutoScroll();
    };

    // --- Attach Event Listeners ---
    track.addEventListener('transitionend', checkIndexOnTransitionEnd);
    carouselContainer.addEventListener('mousedown', dragStart);
    carouselContainer.addEventListener('touchstart', dragStart, { passive: true });
    carouselContainer.addEventListener('mouseup', dragEnd);
    carouselContainer.addEventListener('touchend', dragEnd);
    carouselContainer.addEventListener('mouseleave', dragEnd);
    carouselContainer.addEventListener('mousemove', drag);
    carouselContainer.addEventListener('touchmove', drag, { passive: true });
    window.addEventListener('resize', init);

    // Initial setup
    init();
});
