/**
 * Validation utilities for vendor application data
 */

/**
 * Validate vendor application data
 * Returns array of validation errors
 */
function validateVendorData(data) {
  const errors = [];
  
  // Required fields
  const requiredFields = [
    { field: 'vendorName', message: 'Company name is required' },
    { field: 'taxId', message: 'Business Tax ID is required' },
    { field: 'mainContactName', message: 'Main contact name is required' },
    { field: 'mainContactEmail', message: 'Main contact email is required' },
    { field: 'mainContactPhone', message: 'Main contact phone is required' },
    { field: 'vendorAddress', message: 'Business address is required' },
    { field: 'primaryMarket', message: 'Primary market is required' },
    { field: 'primaryTrade', message: 'Primary trade is required' },
    { field: 'numCrews', message: 'Number of crews is required' }
  ];
  
  // Check required fields
  requiredFields.forEach(({ field, message }) => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({ field, message });
    }
  });
  
  // Validate email format
  if (data.mainContactEmail && !isValidEmail(data.mainContactEmail)) {
    errors.push({
      field: 'mainContactEmail',
      message: 'Please enter a valid email address'
    });
  }
  
  if (data.additionalContactEmail && !isValidEmail(data.additionalContactEmail)) {
    errors.push({
      field: 'additionalContactEmail',
      message: 'Please enter a valid additional email address'
    });
  }
  
  // Validate phone format
  if (data.mainContactPhone && !isValidPhone(data.mainContactPhone)) {
    errors.push({
      field: 'mainContactPhone',
      message: 'Please enter a valid 10-digit phone number'
    });
  }
  
  if (data.additionalPhone && !isValidPhone(data.additionalPhone)) {
    errors.push({
      field: 'additionalPhone',
      message: 'Please enter a valid additional phone number'
    });
  }
  
  // Validate Tax ID format
  if (data.taxId && !isValidTaxId(data.taxId)) {
    errors.push({
      field: 'taxId',
      message: 'Tax ID must be in format XX-XXXXXXX (EIN) or XXX-XX-XXXX (SSN)'
    });
  }
  
  // Validate service line selection
  if (!data.serviceLine || (Array.isArray(data.serviceLine) && data.serviceLine.length === 0)) {
    errors.push({
      field: 'serviceLine',
      message: 'Please select at least one service line'
    });
  }
  
  // Validate services selection
  if (!data.services || (Array.isArray(data.services) && data.services.length === 0)) {
    errors.push({
      field: 'services',
      message: 'Please select at least one service'
    });
  }
  
  // Validate payment method
  const validPaymentMethods = ['ACH', 'Check', 'Virtual Card'];
  if (data.paymentMethod && !validPaymentMethods.includes(data.paymentMethod)) {
    errors.push({
      field: 'paymentMethod',
      message: 'Please select a valid payment method'
    });
  }
  
  // Validate number fields
  if (data.numCrews && (isNaN(data.numCrews) || parseInt(data.numCrews) < 1)) {
    errors.push({
      field: 'numCrews',
      message: 'Number of crews must be at least 1'
    });
  }
  
  if (data.travelRadius && isNaN(data.travelRadius)) {
    errors.push({
      field: 'travelRadius',
      message: 'Travel radius must be a number'
    });
  }
  
  if (data.travelPeople && isNaN(data.travelPeople)) {
    errors.push({
      field: 'travelPeople',
      message: 'Number of people available to travel must be a number'
    });
  }
  
  // Validate dates (future dates for expiration)
  if (data.glExpiration && !isValidFutureDate(data.glExpiration)) {
    errors.push({
      field: 'glExpiration',
      message: 'GL insurance expiration date must be in the future'
    });
  }
  
  if (data.wcExpiration && !isValidFutureDate(data.wcExpiration)) {
    errors.push({
      field: 'wcExpiration',
      message: 'WC insurance expiration date must be in the future'
    });
  }
  
  // Validate certification checkbox
  if (!data.certification || data.certification !== 'true') {
    errors.push({
      field: 'certification',
      message: 'You must certify that all information is accurate'
    });
  }
  
  return errors;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
function isValidPhone(phone) {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's exactly 10 digits
  return cleaned.length === 10;
}

/**
 * Validate Tax ID format
 */
function isValidTaxId(taxId) {
  // EIN format: XX-XXXXXXX
  const einRegex = /^\d{2}-\d{7}$/;
  // SSN format: XXX-XX-XXXX
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  
  return einRegex.test(taxId) || ssnRegex.test(taxId);
}

/**
 * Validate future date
 */
function isValidFutureDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date > today;
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize all fields in an object
 */
function sanitizeFormData(data) {
  const sanitized = {};
  
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      if (typeof data[key] === 'string') {
        sanitized[key] = sanitizeInput(data[key]);
      } else if (Array.isArray(data[key])) {
        sanitized[key] = data[key].map(item => 
          typeof item === 'string' ? sanitizeInput(item) : item
        );
      } else {
        sanitized[key] = data[key];
      }
    }
  }
  
  return sanitized;
}

module.exports = {
  validateVendorData,
  isValidEmail,
  isValidPhone,
  isValidTaxId,
  isValidFutureDate,
  sanitizeInput,
  sanitizeFormData
};
