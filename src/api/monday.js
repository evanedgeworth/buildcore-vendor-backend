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
 * @param {string} vendorName - The vendor company name
 * @param {object} columnValues - Column values to set
 * @param {boolean} isComplete - Whether all core fields are filled
 */
async function createVendorItem(vendorName, columnValues, isComplete = true) {
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

  // Prepend (Incomplete) to name if core fields are not filled (easier to sort)
  const displayName = isComplete ? vendorName : `(Incomplete) ${vendorName}`;
  
  const variables = {
    boardId: MONDAY_BOARD_ID,
    itemName: displayName,
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
 * Add file links to Monday.com Files column
 * Files are uploaded to Google Drive, links stored in dedicated Files column
 * Uses Markdown format for clickable, readable links
 */
async function addFileLinksToFilesColumn(itemId, driveUploadResults) {
  if (!driveUploadResults || driveUploadResults.length === 0) return;
  
  try {
    // Format as HTML links for Monday.com long text columns
    // HTML <a> tags work in Monday.com long text columns and are clickable
    const fileLinks = driveUploadResults
      .filter(r => r.success)
      .map(r => {
        // Use just the filename as the clickable link text
        const filename = r.filename || r.friendlyName;
        // Create HTML link: <a href="URL">filename</a>
        return `<a href="${r.viewLink}" target="_blank">${filename}</a>`;
      })
      .join('<br>');  // HTML line break for proper spacing
    
    if (!fileLinks) return;
    
    const mutation = `
      mutation {
        change_multiple_column_values(
          board_id: ${MONDAY_BOARD_ID},
          item_id: ${itemId},
          column_values: ${JSON.stringify(JSON.stringify({
            long_text_mkwgnz91: fileLinks
          }))}
        ) {
          id
        }
      }
    `;
    
    const response = await mondayClient.post('', { query: mutation });
    
    if (response.data.errors) {
      console.error('Failed to add file links to Files column:', response.data.errors[0].message);
    } else {
      console.log(`✅ Added file links to Monday.com Files column`);
    }
  } catch (error) {
    console.error('Failed to update Files column with file links:', error.message);
  }
}

/**
 * Find existing vendor item by Tax ID
 * @param {string} taxId - Business Tax ID to search for
 * @returns {Promise<object|null>} - Found item or null
 */
async function findVendorByTaxId(taxId) {
  if (!taxId || !taxId.trim()) return null;
  
  const query = `
    query {
      boards(ids: [${MONDAY_BOARD_ID}]) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values(ids: ["business_tax___mknb862c"]) {
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
      console.error('Error finding vendor:', response.data.errors);
      return null;
    }

    const items = response.data.data.boards[0]?.items_page?.items || [];
    
    // Find item with matching tax ID
    for (const item of items) {
      const taxIdCol = item.column_values.find(col => col.id === 'business_tax___mknb862c');
      if (taxIdCol && taxIdCol.text && taxIdCol.text.trim() === taxId.trim()) {
        console.log(`Found existing vendor: ${item.name} (ID: ${item.id})`);
        return item;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding vendor by Tax ID:', error.message);
    return null;
  }
}

/**
 * Update existing vendor item with new data
 * @param {string} itemId - Monday.com item ID
 * @param {object} columnValues - Column values to update
 * @returns {Promise<object>} - Updated item
 */
async function updateVendorItem(itemId, columnValues) {
  const mutation = `
    mutation {
      change_multiple_column_values(
        board_id: ${MONDAY_BOARD_ID},
        item_id: ${itemId},
        column_values: ${JSON.stringify(JSON.stringify(columnValues))}
      ) {
        id
        name
      }
    }
  `;

  try {
    const response = await mondayClient.post('', { query: mutation });
    
    if (response.data.errors) {
      console.error('Monday.com API errors:', response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    console.log(`Updated Monday.com item: ${itemId}`);
    return response.data.data.change_multiple_column_values;
  } catch (error) {
    console.error('Failed to update Monday.com item:', error.message);
    throw error;
  }
}

/**
 * Update item name (to remove or add (Incomplete) tag)
 * @param {string} itemId - Monday.com item ID
 * @param {string} newName - New name for the item
 * @returns {Promise<object>} - Updated item
 */
async function updateItemName(itemId, newName) {
  const mutation = `
    mutation {
      change_simple_column_value(
        board_id: ${MONDAY_BOARD_ID},
        item_id: ${itemId},
        column_id: "name",
        value: ${JSON.stringify(newName)}
      ) {
        id
        name
      }
    }
  `;

  try {
    const response = await mondayClient.post('', { query: mutation });
    
    if (response.data.errors) {
      console.error('Monday.com API errors:', response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    console.log(`Updated item name to: ${newName}`);
    return response.data.data.change_simple_column_value;
  } catch (error) {
    console.error('Failed to update item name:', error.message);
    throw error;
  }
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
  addFileLinksToFilesColumn,
  getColumnMappings,
  findVendorByTaxId,
  updateVendorItem,
  updateItemName
};
