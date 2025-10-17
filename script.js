// Form state object to track all input values
const formState = {
    studentName: '',
    age: '',
    gender: '',
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
                if (formState.age) ageInput.value = formState.age;
                if (formState.gender) genderSelect.value = formState.gender;
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

// Get all form elements
const form = document.getElementById('registrationForm');
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const page3 = document.getElementById('page3');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const submitBtn = document.getElementById('submitBtn');
const iframe = document.getElementById('hidden_iframe');

// Set form to submit to hidden iframe
form.target = 'hidden_iframe';

// Listen for iframe load event (form submission complete)
if (iframe) {
    iframe.onload = function() {
        // Form has been submitted successfully
        console.log('Form submitted successfully to Google Forms');

        // Transition to success page
        page2.classList.remove('active');
        page2.classList.add('slide-out-left');
        page3.classList.add('active');

        // Hide the form so it doesn't take up space
        form.style.display = 'none';

        // Position the success page at the top of the card
        page3.style.top = '0';

        // Clear the cookie since form was submitted
        clearFormCookie();
    };
}

// Get all input fields
const studentNameInput = document.getElementById('studentName');
const ageInput = document.getElementById('age');
const genderSelect = document.getElementById('gender');
const levelSelect = document.getElementById('level');
const preferredTimeSelect = document.getElementById('preferredTime');
const durationInput = document.getElementById('duration');

// Function to validate page 1 fields
function validatePage1() {
    const isValid = formState.studentName.trim() !== '' &&
                    formState.age.trim() !== '' &&
                    formState.gender !== '';
    nextBtn.disabled = !isValid;
}

// Function to validate page 2 fields
function validatePage2() {
    const isValid = formState.level !== '' &&
                    formState.preferredTime !== '' &&
                    formState.duration.trim() !== '';
    submitBtn.disabled = !isValid;
}

// Track form values in real-time
studentNameInput.addEventListener('input', (e) => {
    formState.studentName = e.target.value;
    validatePage1();
    saveFormToCookie();
});

ageInput.addEventListener('input', (e) => {
    formState.age = e.target.value;
    validatePage1();
    saveFormToCookie();
});

genderSelect.addEventListener('change', (e) => {
    formState.gender = e.target.value;
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

// Handle form submission
form.addEventListener('submit', () => {
    // Don't prevent default - let form submit to iframe
    // The iframe onload event will handle the success page transition

    // Log form values to console for debugging
    console.log('Submitting to Google Forms:', {
        'Student Name': formState.studentName,
        'Age': formState.age,
        'Gender': formState.gender,
        'Level': formState.level,
        'Preferred Time': formState.preferredTime,
        'Performance Duration': formState.duration
    });
});

// Load saved form data from cookie on page load
loadFormFromCookie();

// Initialize button states
validatePage1();
validatePage2();
