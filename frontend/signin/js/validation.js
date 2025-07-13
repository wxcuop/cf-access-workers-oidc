/* ====================================
   VALIDATION.JS - Form Validation Functions
   ==================================== */

/**
 * Form validation utilities and real-time validation
 */
const Validation = {
    /**
     * Validation rules and messages
     */
    rules: {
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        
        password: {
            minLength: 8,
            patterns: {
                uppercase: /[A-Z]/,
                lowercase: /[a-z]/,
                number: /[0-9]/,
                special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
            },
            messages: {
                minLength: 'Password must be at least 8 characters long',
                uppercase: 'Password must contain at least one uppercase letter',
                lowercase: 'Password must contain at least one lowercase letter',
                number: 'Password must contain at least one number',
                special: 'Password must contain at least one special character'
            }
        },

        fullName: {
            pattern: /^[a-zA-Z\s]{2,50}$/,
            message: 'Full name must be 2-50 characters and contain only letters and spaces'
        },

        required: {
            message: 'This field is required'
        }
    },

    /**
     * Validate email address
     */
    validateEmail(email) {
        const errors = [];
        
        if (!email || email.trim() === '') {
            errors.push(this.rules.required.message);
            return { isValid: false, errors };
        }

        const trimmedEmail = email.trim();
        
        if (!this.rules.email.pattern.test(trimmedEmail)) {
            errors.push(this.rules.email.message);
        }

        if (trimmedEmail.length > 254) {
            errors.push('Email address is too long (maximum 254 characters)');
        }

        return {
            isValid: errors.length === 0,
            errors,
            value: trimmedEmail
        };
    },

    /**
     * Validate password strength
     */
    validatePassword(password) {
        const errors = [];
        const requirements = {
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            special: false
        };

        if (!password || password.trim() === '') {
            errors.push(this.rules.required.message);
            return { 
                isValid: false, 
                errors, 
                requirements,
                strength: 0
            };
        }

        // Check minimum length
        if (password.length < this.rules.password.minLength) {
            errors.push(this.rules.password.messages.minLength);
        } else {
            requirements.length = true;
        }

        // Check for uppercase letter
        if (!this.rules.password.patterns.uppercase.test(password)) {
            errors.push(this.rules.password.messages.uppercase);
        } else {
            requirements.uppercase = true;
        }

        // Check for lowercase letter
        if (!this.rules.password.patterns.lowercase.test(password)) {
            errors.push(this.rules.password.messages.lowercase);
        } else {
            requirements.lowercase = true;
        }

        // Check for number
        if (!this.rules.password.patterns.number.test(password)) {
            errors.push(this.rules.password.messages.number);
        } else {
            requirements.number = true;
        }

        // Check for special character
        if (!this.rules.password.patterns.special.test(password)) {
            errors.push(this.rules.password.messages.special);
        } else {
            requirements.special = true;
        }

        // Calculate strength (0-100)
        const metRequirements = Object.values(requirements).filter(Boolean).length;
        const strength = Math.round((metRequirements / 5) * 100);

        return {
            isValid: errors.length === 0,
            errors,
            requirements,
            strength
        };
    },

    /**
     * Validate password confirmation
     */
    validatePasswordConfirmation(password, confirmPassword) {
        const errors = [];

        if (!confirmPassword || confirmPassword.trim() === '') {
            errors.push(this.rules.required.message);
            return { isValid: false, errors };
        }

        if (password !== confirmPassword) {
            errors.push('Passwords do not match');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate full name
     */
    validateFullName(fullName) {
        const errors = [];

        if (!fullName || fullName.trim() === '') {
            errors.push(this.rules.required.message);
            return { isValid: false, errors };
        }

        const trimmedName = fullName.trim();

        if (!this.rules.fullName.pattern.test(trimmedName)) {
            errors.push(this.rules.fullName.message);
        }

        return {
            isValid: errors.length === 0,
            errors,
            value: trimmedName
        };
    },

    /**
     * Validate checkbox (terms, etc.)
     */
    validateCheckbox(isChecked, message = 'You must accept this to continue') {
        const errors = [];

        if (!isChecked) {
            errors.push(message);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Real-time validation setup for form inputs
     */
    setupRealTimeValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            const debouncedValidation = Utils.debounce(() => {
                this.validateAndUpdateField(input, this.validateEmail);
            }, 300);

            input.addEventListener('input', debouncedValidation);
            input.addEventListener('blur', () => {
                this.validateAndUpdateField(input, this.validateEmail);
            });
        });

        // Password validation
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            // Skip confirm password inputs for now
            if (input.name === 'confirmPassword') return;

            const debouncedValidation = Utils.debounce(() => {
                this.validateAndUpdatePasswordField(input);
            }, 300);

            input.addEventListener('input', debouncedValidation);
            input.addEventListener('blur', () => {
                this.validateAndUpdatePasswordField(input);
            });
        });

        // Password confirmation validation
        const confirmPasswordInputs = document.querySelectorAll('input[name="confirmPassword"]');
        confirmPasswordInputs.forEach(input => {
            const passwordInput = document.querySelector('input[name="password"]');
            if (!passwordInput) return;

            const debouncedValidation = Utils.debounce(() => {
                this.validateAndUpdateConfirmPasswordField(input, passwordInput);
            }, 300);

            input.addEventListener('input', debouncedValidation);
            input.addEventListener('blur', () => {
                this.validateAndUpdateConfirmPasswordField(input, passwordInput);
            });
        });

        // Full name validation
        const nameInputs = document.querySelectorAll('input[name="fullName"]');
        nameInputs.forEach(input => {
            const debouncedValidation = Utils.debounce(() => {
                this.validateAndUpdateField(input, this.validateFullName);
            }, 300);

            input.addEventListener('input', debouncedValidation);
            input.addEventListener('blur', () => {
                this.validateAndUpdateField(input, this.validateFullName);
            });
        });
    },

    /**
     * Update field UI based on validation result
     */
    validateAndUpdateField(input, validator) {
        const result = validator.call(this, input.value);
        const errorElement = document.getElementById(input.getAttribute('aria-describedby'));

        // Update input classes
        input.classList.remove('error', 'success');
        if (input.value.trim() !== '') {
            input.classList.add(result.isValid ? 'success' : 'error');
        }

        // Update error message
        if (errorElement) {
            errorElement.textContent = result.errors.join(', ');
        }

        return result;
    },

    /**
     * Update password field with requirements
     */
    validateAndUpdatePasswordField(input) {
        const result = this.validatePassword(input.value);
        const errorElement = document.getElementById(input.getAttribute('aria-describedby'));
        
        // Update input classes
        input.classList.remove('error', 'success');
        if (input.value.trim() !== '') {
            input.classList.add(result.isValid ? 'success' : 'error');
        }

        // Update error message
        if (errorElement && result.errors.length > 0) {
            errorElement.textContent = result.errors[0]; // Show first error only
        } else if (errorElement) {
            errorElement.textContent = '';
        }

        // Update password requirements UI
        this.updatePasswordRequirements(result.requirements);

        return result;
    },

    /**
     * Update confirm password field
     */
    validateAndUpdateConfirmPasswordField(confirmInput, passwordInput) {
        const result = this.validatePasswordConfirmation(passwordInput.value, confirmInput.value);
        const errorElement = document.getElementById(confirmInput.getAttribute('aria-describedby'));

        // Update input classes
        confirmInput.classList.remove('error', 'success');
        if (confirmInput.value.trim() !== '') {
            confirmInput.classList.add(result.isValid ? 'success' : 'error');
        }

        // Update error message
        if (errorElement) {
            errorElement.textContent = result.errors.join(', ');
        }

        return result;
    },

    /**
     * Update password requirements visual indicators
     */
    updatePasswordRequirements(requirements) {
        const requirementElements = {
            length: document.getElementById('req-length'),
            uppercase: document.getElementById('req-uppercase'),
            lowercase: document.getElementById('req-lowercase'),
            number: document.getElementById('req-number'),
            special: document.getElementById('req-special')
        };

        Object.keys(requirements).forEach(req => {
            const element = requirementElements[req];
            if (element) {
                element.classList.toggle('valid', requirements[req]);
            }
        });
    },

    /**
     * Validate entire form
     */
    validateForm(formElement) {
        const results = {};
        const inputs = formElement.querySelectorAll('input[required], input[data-validate]');
        let isFormValid = true;

        inputs.forEach(input => {
            let result;

            switch (input.type) {
                case 'email':
                    result = this.validateAndUpdateField(input, this.validateEmail);
                    break;
                    
                case 'password':
                    if (input.name === 'confirmPassword') {
                        const passwordInput = formElement.querySelector('input[name="password"]');
                        result = this.validateAndUpdateConfirmPasswordField(input, passwordInput);
                    } else {
                        result = this.validateAndUpdatePasswordField(input);
                    }
                    break;
                    
                case 'text':
                    if (input.name === 'fullName') {
                        result = this.validateAndUpdateField(input, this.validateFullName);
                    } else {
                        result = { isValid: input.value.trim() !== '', errors: [] };
                    }
                    break;
                    
                case 'checkbox':
                    result = this.validateCheckbox(input.checked);
                    const errorElement = document.getElementById(input.name + '-error');
                    if (errorElement) {
                        errorElement.textContent = result.errors.join(', ');
                    }
                    break;
                    
                default:
                    result = { isValid: input.value.trim() !== '', errors: [] };
            }

            results[input.name] = result;
            
            if (!result.isValid) {
                isFormValid = false;
            }
        });

        return {
            isValid: isFormValid,
            results
        };
    },

    /**
     * Clear all validation states
     */
    clearValidation(formElement) {
        const inputs = formElement.querySelectorAll('input');
        const errorElements = formElement.querySelectorAll('.form-error');

        inputs.forEach(input => {
            input.classList.remove('error', 'success');
        });

        errorElements.forEach(element => {
            element.textContent = '';
        });

        // Reset password requirements
        const requirements = document.querySelectorAll('.requirement');
        requirements.forEach(req => {
            req.classList.remove('valid');
        });
    },

    /**
     * Show form-wide error message
     */
    /**
     * Show form-wide error message
     */
    showFormError(formElement, message) {
        const errorElement = formElement.querySelector('#form-error');
        if (errorElement) {
            // Use innerHTML to allow HTML content like links
            errorElement.innerHTML = message;
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    /**
     * Clear form-wide error message
     */
    clearFormError(formElement) {
        const errorElement = formElement.querySelector('#form-error');
        if (errorElement) {
            errorElement.innerHTML = '';
        }
    },

    /**
     * Initialize validation for the page
     */
    init() {
        this.setupRealTimeValidation();
        console.log('Validation system initialized');
    }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Validation.init();
    });
} else {
    Validation.init();
}

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validation;
}
