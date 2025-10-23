document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('report-form');
    const submitBtn = document.getElementById('submit-btn');
    const descriptionInput = document.getElementById('description');
    const descriptionError = document.getElementById('description-error');
    const formContainer = document.getElementById('form-container');
    const successMessage = document.getElementById('success-message');

    // 1. Autopopulate device information on page load
    const deviceInfoInput = document.getElementById('device-info');
    deviceInfoInput.value = `User Agent: ${navigator.userAgent}\nScreen: ${window.innerWidth}x${window.innerHeight}`;

    // 2. Simple real-time validation for the description field
    descriptionInput.addEventListener('input', () => {
        if (descriptionInput.value.trim() !== '') {
            descriptionError.textContent = '';
        }
    });

    // 3. Handle form submission
    reportForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default browser submission

        // Basic validation
        if (descriptionInput.value.trim() === '') {
            descriptionError.textContent = 'لطفاً توضیحات را وارد کنید.';
            descriptionInput.focus();
            return;
        }

        // Disable button to prevent multiple submissions
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال ارسال...';

        // Simulate sending data to a server (API call)
        setTimeout(() => {
            // Get form data
            const formData = new FormData(reportForm);
            console.log('--- Form Data Submitted ---');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            console.log('---------------------------');

            // Show success message and hide the form
            formContainer.hidden = true;
            successMessage.hidden = false;

        }, 1500); // Simulate 1.5 seconds of network latency
    });
});