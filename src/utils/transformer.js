/**
 * Transform form data to Monday.com column format
 * This is the heart of the integration - mapping form fields to Monday columns
 */

// Column mapping configuration
// Updated with actual column IDs from your Monday.com board
const COLUMN_MAPPINGS = {
  // Text columns
  businessTaxId: 'business_tax___mknb862c',        // Business Tax #
  mainContactName: 'contact_name_mknb7bpw',       // Main Contact Name
  additionalContactName: 'text_mknbhej1',         // Additional Contact Name (Field Contact)
  address: 'address_mknbb1r0',                    // Vendor Address W-9
  secondaryMarkets: 'additional_markets_mknb88ce', // Secondary Markets
  certifications: 'certifications_mknb9hp6',      // Certifications
  travelNotes: 'long_text_mkq15as',               // Travel Notes
  referralBy: 'text_mknzaa23',                    // Referral By
  
  // Email columns
  mainEmail: 'email_mknbjaey',                    // Main Contact Email
  additionalEmail: 'office_email_mknb9g20',       // Additional Email
  
  // Phone columns
  mainPhone: 'phone___mknbzy27',                  // Main Contact Phone #
  additionalPhone: 'additional_phone___mknb9e36', // Additional Phone #
  
  // Number columns
  numCrews: '__of_crews_mknb728w',                // # of Crews
  travelRadius: 'text_mkq1gg2q',                  // Travel Radius (Miles)
  travelPeople: 'text_mkq1h1bg',                  // # of People Available to Travel!
  
  // Status/Label columns
  status: 'status_mknbjepv',                      // Status
  source: 'color_mkw8j9vt',                       // Source
  serviceLine: 'color_mknsnftt',                  // Service Line
  rowColor: 'row_color_mknb4rb5',                 // Row Color
  
  // Dropdown columns
  primaryMarket: 'market_mknbpdg8',               // Primary Market
  primaryTrade: 'color_mkp06wz8',                 // Primary Trade
  paymentMethod: 'color_mknbqdny',                // ACH / CHECK /Virtual Card
  
  // Date columns
  glExpiration: 'coi_expiration_date__mknbah9e',  // GL Expiration Date
  wcExpiration: 'date_mknt4qgc',                  // WC Expiration Date
  dateCreated: 'date_mknj9jy0',                   // Date Created
  vendorContractEmailed: 'vendor_contract_emailed_mknb2z9y', // Vendor Contract Emailed
  
  // Checkbox columns (for services/trades)
  cabinets: 'cabinets_mknb8tjp',
  carpentry: 'carpentry_mknb4fh7',
  carpets: 'color_mkp0h6dx',
  cleaning: 'cleaning_mknb7sn1',
  countertops: 'color_mknzjyg6',
  demo: 'demo_mknb3j9z',
  drywall: 'drywall_mknbkyqp',
  ductCleaning: 'color_mkp0y8ek',
  electrical: 'electrical_mknb3c41',
  flooring: 'flooring_mknb8cd',
  foundation: 'color_mkp0tq8h',
  garageDoor: 'color_mkp0h6g',
  generalContractor: 'color_mknpfcry',
  glassWindows: 'color_mkp0daf8',
  handyman: 'color_mkp0mq7g',
  hvac: 'hvac_mknbd7gd',
  landscaping: 'color_mkp0t492',
  painting: 'paint_mknb1j8g',
  pestControl: 'pest_control_mknbnz61',
  plumbing: 'plumbing_mknb347f',
  roofing: 'roofing_mknbcej7',
  rainGutters: 'color_mkp07dhg',
  septic: 'color_mkp0vqta',
  tile: 'tile_mknby26b',
  waterRestoration: 'color_mkp06rfe',
  
  // Yes/No columns
  willTravel: 'color_mkq1qzbz',                   // Will Travel
  vendorContractReceived: 'color_mknbvjth',       // Vendor Contract Received?
  glReceived: 'cois_received__mknbnv4c',          // GL Received?
  wcReceived: 'color_mknt71s4',                   // WC Received?
  w9Form: 'w9_form_mknb587z',                     // W9 Form
  
  // Long text columns
  notes: 'notes_mknbkfs0'                         // Notes
};

// Service name mapping (form values to column names)
const SERVICE_TO_COLUMN = {
  'Cabinets': 'cabinets',
  'Carpentry': 'carpentry',
  'Carpets': 'carpets',
  'Cleaning': 'cleaning',
  'Countertops': 'countertops',
  'Demo': 'demo',
  'Drywall': 'drywall',
  'Duct Cleaning': 'ductCleaning',
  'Electrical': 'electrical',
  'Flooring': 'flooring',
  'Foundation': 'foundation',
  'Garage Door': 'garageDoor',
  'General Contractor': 'generalContractor',
  'Glass/Windows': 'glassWindows',
  'Handyman/Small Jobs': 'handyman',
  'HVAC': 'hvac',
  'Landscaping': 'landscaping',
  'Painting': 'painting',
  'Pest Control': 'pestControl',
  'Plumbing': 'plumbing',
  'Rain Gutters': 'rainGutters',
  'Roofing': 'roofing',
  'Septic': 'septic',
  'Tile': 'tile',
  'Water Restoration': 'waterRestoration'
};

/**
 * Transform form data to Monday.com format
 */
function transformFormData(formData) {
  const columnValues = {};
  
  // Set default values (only if columns exist)
  // Status columns use { label: 'value' } format
  if (COLUMN_MAPPINGS.status) {
    columnValues[COLUMN_MAPPINGS.status] = { label: 'New Lead' };
  }
  
  // Map Source column from referralSource field
  if (COLUMN_MAPPINGS.source && formData.referralSource) {
    // Map referral source to Monday.com's source column values
    const sourceMap = {
      'BC Website': 'BC Website',
      'Google': 'BC Website',
      'Bing': 'BC Website',
      'LinkedIn': 'BC Website',
      'Facebook': 'Facebook',
      'Conference': 'BC Website',
      'Email': 'Email Campaign',
      'Referral': 'Existing Vendor', // Referral from current vendor
      'Employee': 'Internal Reference',
      'Internal Reference': 'Internal Reference',
      'Other': 'BC Website'
    };
    columnValues[COLUMN_MAPPINGS.source] = { 
      label: sourceMap[formData.referralSource] || 'BC Website'
    };
  } else if (COLUMN_MAPPINGS.source) {
    // Default to BC Website if no referral source specified
    columnValues[COLUMN_MAPPINGS.source] = { label: 'BC Website' };
  }
  if (COLUMN_MAPPINGS.dateCreated) {
    columnValues[COLUMN_MAPPINGS.dateCreated] = { date: new Date().toISOString().split('T')[0] };
  }
  if (COLUMN_MAPPINGS.vendorContractEmailed) {
    // This is a status column, not a date
    columnValues[COLUMN_MAPPINGS.vendorContractEmailed] = { label: 'Yes' };
  }
  
  // Map text fields
  if (formData.taxId) {
    columnValues[COLUMN_MAPPINGS.businessTaxId] = formData.taxId;
  }
  if (formData.mainContactName) {
    columnValues[COLUMN_MAPPINGS.mainContactName] = formData.mainContactName;
  }
  if (formData.additionalContactName) {
    columnValues[COLUMN_MAPPINGS.additionalContactName] = formData.additionalContactName;
  }
  if (formData.vendorAddress) {
    columnValues[COLUMN_MAPPINGS.address] = formData.vendorAddress;
  }
  if (formData.certifications) {
    columnValues[COLUMN_MAPPINGS.certifications] = formData.certifications;
  }
  if (formData.travelNotes) {
    columnValues[COLUMN_MAPPINGS.travelNotes] = formData.travelNotes;
  }
  
  // Map Referral By field - populate when Internal Reference or Employee referral
  if (formData.referralSource === 'Internal Reference' && formData.referralEmployeeName) {
    columnValues[COLUMN_MAPPINGS.referralBy] = formData.referralEmployeeName;
  } else if (formData.referralSource === 'Employee' && formData.referralEmployeeName) {
    columnValues[COLUMN_MAPPINGS.referralBy] = formData.referralEmployeeName;
  }
  
  // Map email fields
  if (formData.mainContactEmail) {
    columnValues[COLUMN_MAPPINGS.mainEmail] = {
      email: formData.mainContactEmail,
      text: formData.mainContactEmail
    };
  }
  if (formData.additionalContactEmail) {
    columnValues[COLUMN_MAPPINGS.additionalEmail] = {
      email: formData.additionalContactEmail,
      text: formData.additionalContactEmail
    };
  }
  
  // Map phone fields (text format for Monday.com)
  if (formData.mainContactPhone) {
    columnValues[COLUMN_MAPPINGS.mainPhone] = formData.mainContactPhone;
  }
  if (formData.additionalPhone) {
    columnValues[COLUMN_MAPPINGS.additionalPhone] = formData.additionalPhone;
  }
  
  // Map number fields
  if (formData.numCrews) {
    columnValues[COLUMN_MAPPINGS.numCrews] = parseInt(formData.numCrews) || 1;
  }
  // Travel fields are TEXT columns, not NUMBER columns - send as strings
  if (formData.travelRadius) {
    columnValues[COLUMN_MAPPINGS.travelRadius] = String(formData.travelRadius);
  }
  if (formData.travelPeople) {
    columnValues[COLUMN_MAPPINGS.travelPeople] = String(formData.travelPeople);
  }
  
  // Map status fields - these use { label: 'value' } format (singular)
  if (formData.primaryMarket) {
    columnValues[COLUMN_MAPPINGS.primaryMarket] = { label: formData.primaryMarket };
  } else {
    columnValues[COLUMN_MAPPINGS.primaryMarket] = { label: 'Dallas' }; // Default to Dallas
  }
  
  if (formData.primaryTrade) {
    let trade = formData.primaryTrade;
    if (trade === 'Other' && formData.primaryTradeOther) {
      trade = formData.primaryTradeOther;
    }
    
    // Map form values to Monday.com status labels
    const tradeMap = {
      'Electrical': 'Electrician',
      'General Contractor': 'General Contractor',
      'HVAC': 'HVAC',
      'Plumbing': 'Plumbing',
      'Flooring': 'Flooring',
      'Painting': 'Painting',
      'Roofing': 'Roofer',
      'Carpentry': 'Carpentry',
      'Drywall': 'Drywall',
      'Cabinets': 'Cabinets',
      'Countertops': 'Countertops',
      'Cleaning': 'Cleaning',
      'Landscaping': 'Landscaping',
      'Pest Control': 'Pest Control',
      'Foundation': 'Foundation',
      'Glass/Windows': 'Glass/Windows',
      'Garage Door': 'Garage Doors',
      'Handyman/Small Jobs': 'Handyman/Small Jobs',
      'Water Restoration': 'Water Restoration'
    };
    
    columnValues[COLUMN_MAPPINGS.primaryTrade] = { 
      label: tradeMap[trade] || trade 
    };
  } else {
    columnValues[COLUMN_MAPPINGS.primaryTrade] = { label: 'General Contractor' }; // Default
  }
  
  if (formData.paymentMethod) {
    const paymentMap = {
      'ACH': 'ACH',
      'Check': 'CHECK',
      'Virtual Card': 'Virtual Card'
    };
    columnValues[COLUMN_MAPPINGS.paymentMethod] = { 
      label: paymentMap[formData.paymentMethod] || formData.paymentMethod
    };
  } else {
    columnValues[COLUMN_MAPPINGS.paymentMethod] = { label: 'ACH' }; // Default
  }
  
  // Map service lines - status column can only hold ONE value
  // If multiple selected, use first and add others to notes
  let additionalServiceLines = '';
  if (formData.serviceLine) {
    const serviceLines = Array.isArray(formData.serviceLine) 
      ? formData.serviceLine
      : [formData.serviceLine];
    
    // Use first service line in the status column
    columnValues[COLUMN_MAPPINGS.serviceLine] = { label: serviceLines[0] };
    
    // If multiple selected, add the rest to notes
    if (serviceLines.length > 1) {
      additionalServiceLines = `Service Lines: ${serviceLines.join(', ')}`;
    }
  } else {
    columnValues[COLUMN_MAPPINGS.serviceLine] = { label: 'SFR' }; // Default to SFR
  }
  
  // Map secondary markets - dropdown column uses { labels: ['value'] } (plural with array)
  // Monday.com dropdown columns have limits, so cap at 10 and add rest to notes
  let additionalMarkets = '';
  if (formData.secondaryMarkets) {
    const markets = Array.isArray(formData.secondaryMarkets)
      ? formData.secondaryMarkets
      : [formData.secondaryMarkets];
    
    // Use first 10 markets in dropdown
    const marketsForDropdown = markets.slice(0, 10);
    columnValues[COLUMN_MAPPINGS.secondaryMarkets] = { labels: marketsForDropdown };
    
    // If more than 10, add the rest to notes
    if (markets.length > 10) {
      additionalMarkets = `Additional Secondary Markets: ${markets.slice(10).join(', ')}`;
    }
  }
  
  // Map services to individual checkbox columns
  if (formData.services) {
    const services = Array.isArray(formData.services) ? formData.services : [formData.services];
    
    // Service checkboxes are status columns in Monday.com
    // They need { label: 'Done' } for checked, or omit for unchecked
    
    // Set selected services to "Done"
    services.forEach(service => {
      if (service === 'Other' && formData.servicesOther) {
        // Add to notes if "Other" service is specified
        const currentNotes = columnValues[COLUMN_MAPPINGS.notes] || '';
        columnValues[COLUMN_MAPPINGS.notes] = 
          `${currentNotes}\nOther Services: ${formData.servicesOther}`.trim();
      } else if (SERVICE_TO_COLUMN[service]) {
        const columnKey = SERVICE_TO_COLUMN[service];
        const columnId = COLUMN_MAPPINGS[columnKey];
        if (columnId) {
          // Status columns for checkboxes use label with a specific value
          columnValues[columnId] = { label: 'Yes' };
        }
      }
    });
  }
  
  // Map travel information (status column uses label singular)
  if (formData.willTravel) {
    columnValues[COLUMN_MAPPINGS.willTravel] = { 
      label: formData.willTravel // 'Yes' or 'No'
    };
  }
  
  // Map insurance dates
  if (formData.glExpiration) {
    columnValues[COLUMN_MAPPINGS.glExpiration] = { date: formData.glExpiration };
    columnValues[COLUMN_MAPPINGS.glReceived] = { label: 'Yes' };
  }
  if (formData.wcExpiration) {
    columnValues[COLUMN_MAPPINGS.wcExpiration] = { date: formData.wcExpiration };
    columnValues[COLUMN_MAPPINGS.wcReceived] = { label: 'Yes' };
  }
  
  // Map notes (combine various text fields)
  const noteParts = [];
  if (additionalServiceLines) {
    noteParts.push(additionalServiceLines);
  }
  if (additionalMarkets) {
    noteParts.push(additionalMarkets);
  }
  if (formData.notes) {
    noteParts.push(formData.notes);
  }
  if (formData.glPolicyNumber) {
    noteParts.push(`GL Policy #: ${formData.glPolicyNumber}`);
  }
  if (formData.wcPolicyNumber) {
    noteParts.push(`WC Policy #: ${formData.wcPolicyNumber}`);
  }
  // Referral source is now mapped to Source column, only add Other details to notes
  if (formData.referralSource === 'Other' && formData.referralSourceOther) {
    noteParts.push(`Referral Source Other: ${formData.referralSourceOther}`);
  }
  
  if (noteParts.length > 0) {
    columnValues[COLUMN_MAPPINGS.notes] = noteParts.join('\n');
  }
  
  // Set document received flags if files were uploaded
  // These will be updated by the file upload handler
  
  return columnValues;
}

/**
 * Format phone number for Monday.com
 */
function formatPhone(phone) {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX (Monday's preferred format)
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone; // Return original if not 10 digits
}

module.exports = {
  transformFormData,
  COLUMN_MAPPINGS,
  SERVICE_TO_COLUMN
};
