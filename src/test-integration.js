/**
 * Test script for Monday.com integration
 * Run this to verify your setup is working correctly
 */

const axios = require('axios');
require('dotenv').config();

// Test data for a sample vendor
const testVendor = {
  // Company Information
  vendorName: "Test Vendor - " + new Date().toISOString().slice(0, 10),
  taxId: "12-3456789",
  numCrews: "3",
  primaryTrade: "Plumbing",
  
  // Contact Information
  mainContactName: "John Smith",
  mainContactPhone: "(555) 123-4567",
  mainContactEmail: "test@testvendor.com",
  additionalContactName: "Jane Doe",
  additionalContactEmail: "jane@testvendor.com",
  additionalPhone: "(555) 987-6543",
  
  // Location
  vendorAddress: "123 Main St, Dallas, TX 75201",
  primaryMarket: "Dallas",
  secondaryMarkets: ["Houston", "San Antonio"],
  
  // Services
  serviceLine: ["SFR", "Commercial"],
  services: ["Plumbing", "HVAC", "Water Restoration"],
  
  // Travel
  willTravel: "Yes",
  travelRadius: "50",
  travelPeople: "2",
  travelNotes: "Can travel on weekends with advance notice",
  
  // Insurance
  glExpiration: "2026-12-31",
  glPolicyNumber: "GL123456789",
  wcExpiration: "2026-12-31",
  wcPolicyNumber: "WC987654321",
  hasWC: "Yes",
  
  // Additional
  certifications: "Licensed Master Plumber, EPA Certified",
  paymentMethod: "ACH",
  referralSource: "Website",
  notes: "This is a test vendor submission - please delete after testing",
  
  // Certification
  certification: "true"
};

async function testIntegration() {
  console.log('🧪 Testing Monday.com Integration\n');
  console.log('================================\n');
  
  const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
  
  try {
    // Step 1: Test health check
    console.log('1️⃣  Testing health check...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log('✅ Server is healthy:', healthResponse.data);
    console.log('');
    
    // Step 2: Test Monday.com connection
    console.log('2️⃣  Testing Monday.com connection...');
    try {
      const connectionResponse = await axios.get(`${baseUrl}/api/test-connection`);
      console.log('✅ Monday.com connected successfully!');
      console.log('   User:', connectionResponse.data.data.user.name);
      console.log('   Board:', connectionResponse.data.data.board.name);
      console.log('   Columns found:', connectionResponse.data.data.board.columns.length);
      console.log('');
      
      // Show first 10 columns for verification
      console.log('   First 10 columns:');
      connectionResponse.data.data.board.columns.slice(0, 10).forEach(col => {
        console.log(`     - ${col.title} (${col.id}) [${col.type}]`);
      });
      console.log('');
      
    } catch (error) {
      console.log('❌ Monday.com connection failed:', error.response?.data || error.message);
      console.log('   Please check your MONDAY_API_KEY and MONDAY_BOARD_ID in .env file');
      return;
    }
    
    // Step 3: Test vendor submission
    console.log('3️⃣  Testing vendor submission...');
    console.log('   Vendor Name:', testVendor.vendorName);
    
    // Ask for confirmation before creating test item
    console.log('\n⚠️  This will create a test item in your Monday.com board.');
    console.log('   The vendor name includes today\'s date for easy identification.');
    console.log('   You can delete it after testing.\n');
    
    // Create form data
    const formData = new URLSearchParams();
    Object.keys(testVendor).forEach(key => {
      const value = testVendor[key];
      if (Array.isArray(value)) {
        value.forEach(v => formData.append(key, v));
      } else {
        formData.append(key, value);
      }
    });
    
    try {
      const submitResponse = await axios.post(
        `${baseUrl}/api/vendor-application`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('✅ Vendor submitted successfully!');
      console.log('   Item ID:', submitResponse.data.itemId);
      console.log('   Message:', submitResponse.data.message);
      console.log('');
      console.log('🎉 Integration test completed successfully!');
      console.log('   Check your Monday.com board for the new test vendor.');
      
    } catch (error) {
      console.log('❌ Vendor submission failed:', error.response?.data || error.message);
      
      if (error.response?.data?.errors) {
        console.log('\n   Validation errors:');
        error.response.data.errors.forEach(err => {
          console.log(`     - ${err.field}: ${err.message}`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('   Make sure the server is running (npm start)');
  }
}

// Run the test
console.log('Starting integration test...\n');
console.log('Make sure:');
console.log('1. Your backend server is running (npm start)');
console.log('2. You have configured .env with your Monday.com credentials');
console.log('3. Your Monday.com board ID is correct\n');

setTimeout(() => {
  testIntegration();
}, 2000);
