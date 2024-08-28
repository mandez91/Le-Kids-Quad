document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            targetSection.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Testimonial slider
    const testimonials = document.querySelector('.testimonial-slider');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let slideIndex = 0;

    function showSlide(index) {
        const slides = testimonials.querySelectorAll('.testimonial');
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? 'block' : 'none';
        });
    }

    prevBtn.addEventListener('click', () => {
        slideIndex = (slideIndex - 1 + testimonials.children.length) % testimonials.children.length;
        showSlide(slideIndex);
    });

    nextBtn.addEventListener('click', () => {
        slideIndex = (slideIndex + 1) % testimonials.children.length;
        showSlide(slideIndex);
    });

    showSlide(slideIndex);

    // FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('h3');
        const answer = item.querySelector('p');

        question.addEventListener('click', () => {
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Booking system
    let availabilityData = {};

    async function fetchAvailability(date) {
        try {
            const response = await fetch(`/.netlify/functions/getAvailability?date=${date}`);
            if (!response.ok) {
                throw new Error('Failed to fetch availability');
            }
            availabilityData = await response.json();
            updateTimeSlots();
        } catch (error) {
            console.error('Error fetching availability:', error);
            alert('Failed to load availability. Please try again later.');
        }
    }

    function updateTimeSlots() {
        const dateInput = document.getElementById('date');
        const durationSelect = document.getElementById('duration');
        const timeSelect = document.getElementById('time');
        const selectedDate = dateInput.value;
        const selectedDuration = durationSelect.value;

        timeSelect.innerHTML = '';

        const startHour = 10; // 10 AM
        const endHour = 20; // 8 PM
        const interval = selectedDuration === '15' ? 0.25 : 0.5;

        for (let i = startHour; i < endHour; i += interval) {
            const hour = Math.floor(i);
            const minutes = (i % 1) * 60;
            const timeString = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;

            // Check availability
            const availableATVs = getAvailableATVs(selectedDate, timeString, selectedDuration);
            if (availableATVs === 0) {
                option.disabled = true;
                option.textContent += ' (Fully Booked)';
            } else {
                option.textContent += ` (${availableATVs} ATV${availableATVs > 1 ? 's' : ''} Available)`;
            }

            timeSelect.appendChild(option);
        }
    }

    function getAvailableATVs(date, time, duration) {
        const key = `${date}_${time}_${duration}`;
        return availabilityData[key] || 3; // Default to 3 if no data
    }

    const dateInput = document.getElementById('date');
    const durationSelect = document.getElementById('duration');
    const bookingForm = document.getElementById('booking-form');

    dateInput.addEventListener('change', () => {
        fetchAvailability(dateInput.value);
    });

    durationSelect.addEventListener('change', updateTimeSlots);

    // Set min date to today and fetch initial availability
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
    fetchAvailability(today);

    // Handle booking form submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(bookingForm);
        const bookingData = Object.fromEntries(formData);

        try {
            const response = await fetch('/.netlify/functions/book', {
                method: 'POST',
                body: JSON.stringify(bookingData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Booking failed');
            }

            const result = await response.json();
            if (result.success) {
                alert('Booking confirmed!');
                bookingForm.reset();
                fetchAvailability(dateInput.value); // Refresh availability
            } else {
                alert(result.error || 'Booking failed. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert(error.message || 'An error occurred. Please try again later.');
        }
    });

    // Contact form submission
    const contactForm = document.querySelector('.contact-form');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Here you would typically send the form data to your server
        alert('Message sent! We will get back to you as soon as possible.');
        contactForm.reset();
    });

    // Newsletter form submission
    const newsletterForm = document.querySelector('.newsletter-form');
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Here you would typically send the email to your server for newsletter subscription
        alert('Thank you for subscribing to our newsletter!');
        newsletterForm.reset();
    });
});