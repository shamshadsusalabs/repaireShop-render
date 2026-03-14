# Workshop Invoice - Implementation Summary

## Overview
The invoice has been converted from a colorful gradient design to a professional workshop-style invoice with dynamic data support.

## Key Features

### 1. Dynamic Data Support
- **Parts GST**: Automatically shows the procurement GST% from when the part was purchased from store (`buyGstPercent`)
- **Parts from Inventory**: Shows actual issued parts with their buy GST, HSN code, and part numbers
- **Labour GST**: Manually adjustable (default 18%, can increase/decrease)
- **Fallback**: If no real job data, shows static sample data for preview

### 2. Invoice Sections

#### Header
- LUXRE logo (50x50px)
- Company details (address, GSTIN, phone)
- Invoice type (Tax Invoice / Performa)
- Invoice number and date

#### Bill To & Vehicle Info
- Customer name, ID, and mobile number
- Vehicle model, registration, KM driven
- Assigned mechanic name

#### Parts & Labour Table
Columns: # | Description | HSN | Qty | Rate | GST% | Disc | Amount

**Parts Section (from partsIssued):**
- Shows actual parts issued from store inventory
- Displays part name and part number
- Shows procurement GST% (buyGstPercent from inventory: 5%, 12%, 18%, 28%, etc.)
- HSN codes for each part
- Quantity issued (can be more than 1)
- Unit price from inventory

**Labour Section:**
- Shows CGST and SGST breakdown (e.g., CGST 9% + SGST 9%)
- HSN code: 998714
- Labour charges for each faulty part
- GST% is manually adjustable

#### Totals Section
- Subtotal (Before Tax)
- Discount (if any)
- CGST (calculated based on labour GST%)
- SGST (calculated based on labour GST%)
- Grand Total

#### Footer
- Terms & Conditions
- Customer and Authorized Signatory sections
- Workshop completion statements:
  - "Vehicle has been received from workshop and work done as per my satisfaction"
  - "Payment received from customer, vehicle permitted to leave workshop"
- Powered by SusaLabs

### 3. GST Adjusters (No-Print)
Two separate adjusters visible only on screen:
- **Parts GST %**: Adjusts overall parts tax calculation
- **Labour GST %**: Adjusts labour service tax (shows as CGST/SGST split in table)

### 4. PDF Generation
- Compact design (800px width) to fit A4 properly
- Multi-page support for long invoices
- Clean horizontal lines only (no vertical borders)
- Font sizes: 8-11px for compact printing

## Data Structure

### Part Model (Updated)
```javascript
{
    partName: String,
    partNumber: String,
    buyGstPercent: Number,  // GST at which part was purchased
    sellGstPercent: Number,
    hsnCode: String,        // HSN/SAC code - NEW FIELD
    sellPrice: Number,
    // ... other fields
}
```

### IssuedPart Schema (Updated)
```javascript
{
    partId: ObjectId,
    partName: String,
    partNumber: String,
    quantityIssued: Number,
    unitPrice: Number,
    gstPercent: Number,     // Buy GST from inventory - NEW FIELD
    hsnCode: String,        // HSN code from inventory - NEW FIELD
    issuedBy: ObjectId,
    issuedAt: Date
}
```

### FaultyPart Interface (Updated)
```typescript
export interface FaultyPart {
    partName: string;
    issueDescription: string;
    estimatedCost: number;
    actualCost: number;
    labourCharge: number;
    discount: number;
    procurementGST?: number; // GST at which part was purchased
    hsnCode?: string; // HSN/SAC code for the part
}
```

## Backend Changes

### jobService.js - issueParts()
When parts are issued from inventory to a job, the function now captures:
- `gstPercent`: Copied from `part.buyGstPercent`
- `hsnCode`: Copied from `part.hsnCode`

This ensures the invoice shows the exact GST at which parts were purchased.

## Usage

1. **View Invoice**: Navigate to `/invoice/:jobId`
2. **Parts Display**: 
   - If `partsIssued` exists, shows actual issued parts with buy GST
   - Otherwise, falls back to `faultyParts` data
3. **Adjust Labour GST**: Use the "Labour GST %" adjuster (default 18%)
4. **Print/Download**: 
   - Click "Print Invoice" or "Download PDF"
   - Select invoice type (Tax Invoice or Performa)
   - Confirm to generate

## Technical Details

- **Framework**: React + TypeScript
- **UI Library**: Ant Design
- **PDF Generation**: jsPDF + html2canvas
- **State Management**: Zustand
- **Styling**: Inline styles for PDF compatibility

## Files Modified

1. `reparingShop/src/admin/pages/Invoice.tsx` - Main invoice component with dynamic parts display
2. `reparingShop/src/types.ts` - Added gstPercent and hsnCode to IssuedPart, added procurementGST and hsnCode to FaultyPart
3. `server/src/models/Part.js` - Added hsnCode field
4. `server/src/models/Job.js` - Added gstPercent and hsnCode to issuedPartSchema
5. `server/src/services/jobService.js` - Updated issueParts() to capture buyGstPercent and hsnCode

## Notes

- Parts GST comes from store inventory (`buyGstPercent`) when parts are issued
- Labour GST is manually adjustable per invoice
- Invoice shows CGST/SGST breakdown for labour services
- Clean workshop-style design optimized for printing
- Responsive and fits A4 paper size properly
- HSN codes are captured from inventory and displayed on invoice

