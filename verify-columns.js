#!/usr/bin/env node

/**
 * Verify Monday.com column IDs for Licensed Trades and Files columns
 */

require('dotenv').config();
const axios = require('axios');

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID;

const mondayClient = axios.create({
  baseURL: 'https://api.monday.com/v2',
  headers: {
    'Authorization': MONDAY_API_KEY,
    'Content-Type': 'application/json'
  }
});

async function verifyColumns() {
  console.log('🔍 Checking Monday.com board columns...');
  console.log(`Board ID: ${MONDAY_BOARD_ID}`);
  console.log('');

  const query = `
    query {
      boards(ids: [${MONDAY_BOARD_ID}]) {
        columns {
          id
          title
          type
        }
      }
    }
  `;

  try {
    const response = await mondayClient.post('', { query });
    
    if (response.data.errors) {
      console.error('❌ Error:', response.data.errors[0].message);
      return;
    }

    const columns = response.data.data.boards[0].columns;
    
    console.log('📊 All columns in board:');
    console.log('─'.repeat(80));
    columns.forEach(col => {
      console.log(`${col.title.padEnd(40)} | ${col.id.padEnd(25)} | ${col.type}`);
    });
    console.log('─'.repeat(80));
    console.log('');

    // Check for Licensed Trades column
    const licensedTradesCol = columns.find(col => 
      col.title.toLowerCase().includes('licensed') && 
      col.title.toLowerCase().includes('trade')
    );

    if (licensedTradesCol) {
      console.log('✅ Found Licensed Trades column:');
      console.log(`   Title: ${licensedTradesCol.title}`);
      console.log(`   ID: ${licensedTradesCol.id}`);
      console.log(`   Type: ${licensedTradesCol.type}`);
      console.log('');
      
      // Check if it matches our transformer
      if (licensedTradesCol.id === 'text_mkp1fh85') {
        console.log('✅ Column ID matches transformer.js');
      } else {
        console.log('⚠️  Column ID mismatch!');
        console.log(`   Expected: text_mkp1fh85`);
        console.log(`   Actual: ${licensedTradesCol.id}`);
        console.log('   Update transformer.js with the correct ID!');
      }
    } else {
      console.log('❌ Licensed Trades column NOT FOUND');
      console.log('   Please create this column in Monday.com');
    }
    console.log('');

    // Check for Files column
    const filesCol = columns.find(col => 
      col.title.toLowerCase() === 'files' ||
      col.id === 'long_text_mkwgnz91'
    );

    if (filesCol) {
      console.log('✅ Found Files column:');
      console.log(`   Title: ${filesCol.title}`);
      console.log(`   ID: ${filesCol.id}`);
      console.log(`   Type: ${filesCol.type}`);
      console.log('');
      
      // Check if it matches our transformer
      if (filesCol.id === 'long_text_mkwgnz91') {
        console.log('✅ Column ID matches transformer.js');
      } else {
        console.log('⚠️  Column ID mismatch!');
        console.log(`   Expected: long_text_mkwgnz91`);
        console.log(`   Actual: ${filesCol.id}`);
        console.log('   Update transformer.js or monday.js with the correct ID!');
      }
    } else {
      console.log('❌ Files column NOT FOUND');
      console.log('   Please create this column in Monday.com');
    }
    console.log('');

    // Search for any text columns that might be the ones we need
    console.log('📝 All TEXT type columns:');
    console.log('─'.repeat(80));
    const textColumns = columns.filter(col => col.type === 'text' || col.type === 'long-text');
    textColumns.forEach(col => {
      console.log(`${col.title.padEnd(40)} | ${col.id}`);
    });
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ Failed to verify columns:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

verifyColumns();
