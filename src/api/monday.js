const axios = require('axios');

const MONDAY_API_URL = process.env.MONDAY_API_URL || 'https://api.monday.com/v2';
const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID;

// Create axios instance with default config
const mondayClient = axios.create({
  baseURL: MONDAY_API_URL,
  headers: {
    'Authorization': MONDAY_API_KEY,
    'Content-Type': 'application/json',
    'API-Version': '2024-01'
  }
});

/**
 * Test connection to Monday.com API
 */
async function testConnection() {
  const query = `
    query {
      me {
        name
        email
      }
      boards(ids: [${MONDAY_BOARD_ID}]) {
        name
        id
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
      throw new Error(response.data.errors[0].message);
    }
    
    return {
      user: response.data.data.me,
      board: response.data.data.boards[0]
    };
  } catch (error) {
    console.error('Monday.com connection test failed:', error.message);
    throw error;
  }
}

/**
 * Check if vendor already exists
 */
async function checkDuplicateVendor(taxId, email) {
  const query = `
    query {
      boards(ids: [${MONDAY_BOARD_ID}]) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
            }
          }
        }
      }
    }
  `;

  try {
    const response = await mondayClient.post('', { query });
    
    if (response.data.errors) {
      console.error('Error checking duplicates:', response.data.errors);
      return false; // Don't block submission on error
    }

    const items = response.data.data.boards[0]?.items_page?.items || [];
    
    // Check for matching tax ID or email
    for (const item of items) {
      const values = item.column_values;
      
      // Look for tax ID in column values
      const hasTaxId = values.some(col => 
        col.text && col.text.includes(taxId)
      );
      
      // Look for email in column values
      const hasEmail = values.some(col => 
        col.text && col.text.toLowerCase().includes(email.toLowerCase())
      );
      
      if (hasTaxId || hasEmail) {
        console.log(`Duplicate found: ${item.name} (ID: ${item.id})`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking duplicates:', error.message);
    return false; // Don't block submission on error
  }
}

/**
 * Create a new vendor item in Monday.com
 */
async function createVendorItem(vendorName, columnValues) {
  const mutation = `
    mutation CreateVendorItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `;

  const variables = {
    boardId: MONDAY_BOARD_ID,
    itemName: vendorName,
    columnValues: JSON.stringify(columnValues)
  };

  try {
    console.log('Creating Monday.com item with values:', {
      boardId: MONDAY_BOARD_ID,
      itemName: vendorName,
      columnCount: Object.keys(columnValues).length
    });

    const response = await mondayClient.post('', {
      query: mutation,
      variables
    });

    if (response.data.errors) {
      console.error('Monday.com API errors:', response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.create_item;
  } catch (error) {
    console.error('Failed to create Monday.com item:', error.message);
    throw error;
  }
}

/**
 * Upload files to Monday.com item
 */
async function uploadFiles(itemId, files) {
  const results = [];
  
  // File upload to Monday.com requires a different approach
  // For now, we'll add file names to a text column as a placeholder
  // In production, you'd want to use Monday's file upload endpoint
  
  const fileInfo = [];
  
  if (files.w9Form) {
    fileInfo.push(`W9: ${files.w9Form[0].originalname}`);
  }
  if (files.glInsurance) {
    fileInfo.push(`GL Insurance: ${files.glInsurance[0].originalname}`);
  }
  if (files.wcInsurance) {
    fileInfo.push(`WC Insurance: ${files.wcInsurance[0].originalname}`);
  }
  if (files.businessLicense) {
    fileInfo.push(`Business License: ${files.businessLicense[0].originalname}`);
  }
  
  if (fileInfo.length > 0) {
    // Update the notes column with file information
    const mutation = `
      mutation UpdateItem($itemId: ID!, $columnValues: JSON!) {
        change_column_value(
          item_id: $itemId,
          board_id: ${MONDAY_BOARD_ID},
          column_id: "notes",
          value: $columnValues
        ) {
          id
        }
      }
    `;
    
    const variables = {
      itemId: itemId,
      columnValues: JSON.stringify({
        text: `Files uploaded: ${fileInfo.join(', ')}`
      })
    };
    
    try {
      await mondayClient.post('', {
        query: mutation,
        variables
      });
      
      results.push('File information added to notes');
    } catch (error) {
      console.error('Failed to update file information:', error.message);
    }
  }
  
  return results;
}

/**
 * Get column mappings for the board
 */
async function getColumnMappings() {
  const query = `
    query {
      boards(ids: [${MONDAY_BOARD_ID}]) {
        columns {
          id
          title
          type
          settings_str
        }
      }
    }
  `;

  try {
    const response = await mondayClient.post('', { query });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.boards[0].columns;
  } catch (error) {
    console.error('Failed to get column mappings:', error.message);
    throw error;
  }
}

module.exports = {
  testConnection,
  checkDuplicateVendor,
  createVendorItem,
  uploadFiles,
  getColumnMappings
};
