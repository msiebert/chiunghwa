// Form state object to track all input values
const formState = {
    studentName: '',
    parentName: '',
    age: '',
    level: '',
    preferredTime: '',
    duration: ''
};

// Cookie helper functions
const COOKIE_NAME = 'suzukiFormData';
const COOKIE_DAYS = 7;

function saveFormToCookie() {
    const formData = JSON.stringify(formState);
    const expires = new Date();
    expires.setTime(expires.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(formData)};expires=${expires.toUTCString()};path=/`;
}

function loadFormFromCookie() {
    const nameEQ = COOKIE_NAME + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
            const cookieValue = cookie.substring(nameEQ.length);
            try {
                const savedState = JSON.parse(decodeURIComponent(cookieValue));
                // Restore formState
                Object.assign(formState, savedState);
                // Populate form fields
                if (formState.studentName) studentNameInput.value = formState.studentName;
                if (formState.parentName) parentNameInput.value = formState.parentName;
                if (formState.age) ageInput.value = formState.age;
                if (formState.level) levelSelect.value = formState.level;
                if (formState.preferredTime) preferredTimeSelect.value = formState.preferredTime;
                if (formState.duration) durationInput.value = formState.duration;
                // Re-validate buttons
                validatePage1();
                validatePage2();
                return true;
            } catch (e) {
                console.error('Error loading form data from cookie:', e);
            }
        }
    }
    return false;
}

function clearFormCookie() {
    document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/aFadR8gzyfZP7X588i2VG00';

// Get all form elements
const form = document.getElementById('registrationForm');
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const page3 = document.getElementById('page3');
const page4 = document.getElementById('page4');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const proceedPaymentBtn = document.getElementById('proceedPaymentBtn');
const stripeCheckoutBtn = document.getElementById('stripeCheckoutBtn');
const backFromPaymentBtn = document.getElementById('backFromPaymentBtn');
const iframe = document.getElementById('hidden_iframe');

// Set form to submit to hidden iframe
form.target = 'hidden_iframe';

// Listen for iframe load event (form submission complete)
if (iframe) {
    iframe.onload = function() {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const errorEl = iframeDoc.querySelector('[data-validation-failed="true"]');
            if (errorEl) {
                const loadingContainer = document.getElementById('loadingContainer');
                if (loadingContainer) {
                    loadingContainer.innerHTML = '<p style="color:red;text-align:center;">Registration failed. Please try again or contact us.</p>';
                }
                return;
            }
        } catch (e) {
            // Cross-origin restriction — can't inspect iframe, assume success
        }

        const loadingContainer = document.getElementById('loadingContainer');
        const successContent = document.getElementById('successContent');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
        if (successContent) {
            successContent.style.display = 'flex';
        }
        clearFormCookie();
    };
}

// Get all input fields
const studentNameInput = document.getElementById('studentName');
const parentNameInput = document.getElementById('parentName');
const ageInput = document.getElementById('age');
const levelSelect = document.getElementById('level');
const preferredTimeSelect = document.getElementById('preferredTime');
const durationInput = document.getElementById('duration');

// Function to validate page 1 fields
function validatePage1() {
    const isValid = formState.studentName.trim() !== '' &&
                    formState.parentName.trim() !== '' &&
                    formState.age.trim() !== '';
    nextBtn.disabled = !isValid;
}

// Function to validate page 2 fields
function validatePage2() {
    const isValid = formState.level !== '' &&
                    formState.preferredTime !== '' &&
                    formState.duration.trim() !== '';
    proceedPaymentBtn.disabled = !isValid;
}

// Track form values in real-time
studentNameInput.addEventListener('input', (e) => {
    formState.studentName = e.target.value;
    validatePage1();
    saveFormToCookie();
});

parentNameInput.addEventListener('input', (e) => {
    formState.parentName = e.target.value;
    validatePage1();
    saveFormToCookie();
});

ageInput.addEventListener('input', (e) => {
    formState.age = e.target.value;
    validatePage1();
    saveFormToCookie();
});

levelSelect.addEventListener('change', (e) => {
    formState.level = e.target.value;
    validatePage2();
    saveFormToCookie();
});

preferredTimeSelect.addEventListener('change', (e) => {
    formState.preferredTime = e.target.value;
    validatePage2();
    saveFormToCookie();
});

durationInput.addEventListener('input', (e) => {
    formState.duration = e.target.value;
    validatePage2();
    saveFormToCookie();
});

// Handle Next button click
nextBtn.addEventListener('click', () => {
    // Slide to page 2
    page1.classList.remove('active');
    page1.classList.add('slide-out-left');
    page2.classList.add('active');
});

// Handle Back button click
backBtn.addEventListener('click', () => {
    // Slide back to page 1
    page2.classList.remove('active');
    page1.classList.remove('slide-out-left');
    page1.classList.add('active');
});

// Handle Proceed to Payment button click
proceedPaymentBtn.addEventListener('click', () => {
    // Slide to payment page
    page2.classList.remove('active');
    page2.classList.add('slide-out-left');
    page3.classList.add('active');
});

// Handle Stripe Checkout button click
stripeCheckoutBtn.addEventListener('click', () => {
    // Redirect to Stripe Payment Link
    // The return URL will have ?payment=success parameter
    window.location.href = STRIPE_PAYMENT_LINK + '?client_reference_id=' + Date.now();
});

// Handle Back from Payment button
backFromPaymentBtn.addEventListener('click', () => {
    // Slide back to page 2
    page3.classList.remove('active');
    page2.classList.remove('slide-out-left');
    page2.classList.add('active');
});

// Check if returning from successful payment
function checkPaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        // Payment successful - navigate to page 4 with spinner
        console.log('Payment successful - showing loading spinner');

        // Hide form-pages and show page 4 with spinner
        const formPages = document.querySelector('.form-pages');
        if (formPages) {
            formPages.style.display = 'none';
        }

        // Show page 4 and display the loading spinner
        const loadingContainer = document.getElementById('loadingContainer');
        const successContent = document.getElementById('successContent');
        if (loadingContainer) {
            loadingContainer.style.display = 'flex';
        }
        if (successContent) {
            successContent.style.display = 'none';
        }
        page4.classList.add('active');

        // Submit form to Google Forms after a brief delay
        setTimeout(() => {
            form.requestSubmit();
        }, 500);

        // Remove the payment=success parameter from URL to prevent resubmission
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Handle form submission
form.addEventListener('submit', () => {
    // Don't prevent default - let form submit to iframe
    // The iframe onload event will handle the success page transition

    // Log form values to console for debugging
    console.log('Submitting to Google Forms:', {
        'Student Name': formState.studentName,
        'Parent Name': formState.parentName,
        'Age': formState.age,
        'Level': formState.level,
        'Preferred Time': formState.preferredTime,
        'Performance Duration': formState.duration
    });
});

// Tooltip functionality - show on hover (desktop) or click (mobile)
const tooltipIcon = document.querySelector('.tooltip-icon');
const labelWithTooltip = document.querySelector('.label-with-tooltip');

if (tooltipIcon && labelWithTooltip) {
    tooltipIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        labelWithTooltip.classList.toggle('tooltip-active');
    });

    // Close tooltip when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.label-with-tooltip')) {
            labelWithTooltip.classList.remove('tooltip-active');
        }
    });
}

// Load saved form data from cookie on page load
loadFormFromCookie();

// Check if returning from successful payment
checkPaymentSuccess();

// Initialize button states
validatePage1();
validatePage2();
