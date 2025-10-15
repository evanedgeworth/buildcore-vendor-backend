/**
 * Simple test to isolate the form submission issue
 */

const FormData = require('form-data');

async function testSimpleSubmission() {
  console.log('🧪 Testing simple form submission...\n');
  
  // Create form data with minimal required fields
  const form = new FormData();
  
  // Add only the essential form fields
  form.append('vendorName', 'Test Vendor Simple');
  form.append('primaryTrade', 'General Contractor');
  form.append('taxIdType', 'EIN');
  form.append('taxId', '12-3456789');
  form.append('mainContactName', 'Test Contact');
  form.append('mainContactPhone', '555-123-4567');
  form.append('mainContactEmail', 'test@example.com');
  form.append('vendorAddress', '123 Test St, Test City, TS 12345');
  form.append('primaryMarket', 'Atlanta');
  form.append('serviceLine', 'SFR');
  form.append('additionalServices', 'Carpentry');
  form.append('canTravel', 'Yes');
  form.append('numberOfCrews', '2');
  form.append('glInsurance', 'Yes');
  form.append('wcInsurance', 'Yes');
  form.append('glPolicyNumber', 'GL123456');
  form.append('wcPolicyNumber', 'WC789012');
  form.append('businessLicense', 'Yes');
  form.append('licenseNumber', 'BL345678');
  form.append('licenseExpiration', '2025-12-31');
  form.append('referralSource', 'Website');
  form.append('additionalInfo', 'Simple test submission');
  
  try {
    console.log('📤 Submitting form without files...');
    
    const response = await fetch('http://localhost:3001/api/vendor-application', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    
    console.log('\n📋 Response Status:', response.status);
    console.log('📋 Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Form submitted successfully!');
      console.log('🔗 Monday.com Item ID:', result.itemId);
    } else {
      console.log('\n❌ Form submission failed:', result.error);
    }
    
  } catch (error) {
    console.error('\n❌ Error submitting form:', error.message);
  }
}

// Run the test
testSimpleSubmission().catch(console.error);
