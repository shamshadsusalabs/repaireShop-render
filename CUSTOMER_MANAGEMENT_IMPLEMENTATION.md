# Customer Management System - Implementation Guide

## Overview
Automatic unique customer ID generation and vehicle history tracking integrated directly into job creation flow.

## ✅ COMPLETE - Backend Implementation

### Architecture Decision
**No extra API calls needed!** Customer creation/update happens automatically when job is created.

### 1. Customer Model (`server/src/models/Customer.js`) ✅
**Features:**
- Auto-generated unique Customer ID: `CUST-YYYY-XXXX`
- Mobile number as unique identifier
- Multiple vehicles per customer with KM history
- Customer lifetime stats tracking

### 2. Customer Service (`server/src/services/customerService.js`) ✅
**Key Function:**
- `findOrCreateCustomer()` - Automatically creates or updates customer

### 3. Job Service Integration (`server/src/services/jobService.js`) ✅
**Automatic Integration:**
```javascript
// In createJob() - Line 12-48
1. Customer is automatically created/updated
2. Customer ID is added to job
3. KM reading is stored with job ID
4. No extra API call from frontend needed!

// In completeJob() - Line 242-250
1. Customer stats automatically updated
2. Total jobs incremented
3. Total spent updated
```

### 4. Job Model Updated (`server/src/models/Job.js`) ✅
**Added Field:**
```javascript
customerId: {
    type: String,
    default: '',
    trim: true,
    index: true,
}
```

### 5. Customer Routes (`server/src/routes/customerRoutes.js`) ✅
**Optional APIs for viewing history:**
- GET `/api/customers/mobile/:mobile` - Get customer details
- GET `/api/customers/vehicle-history/:mobile/:carNumber` - Get KM history
- GET `/api/customers` - Search all customers

---

## Frontend Implementation - OPTIONAL ENHANCEMENTS

### Current Status: ✅ WORKS WITHOUT CHANGES
Job creation already works! Customer is created automatically in backend.

### Optional Enhancements (Nice to Have):

#### 1. Show Customer History (Optional)
Add a "Check History" button in job creation forms to show:
- Previous KM readings
- Customer ID
- Total jobs done
- Last visit date

**Locations:**
- `reparingShop/src/admin/pages/CreateJob.tsx`
- `reparingShop/src/manager/pages/ManagerCreateJob.tsx`
- `Repairshop/src/screens/DriverCreateJobScreen.tsx`

#### 2. Receptionist Dashboard Enhancement (Optional)
Show customer stats in search results:
- Customer ID
- Total jobs
- Total spent
- Vehicle history

**Location:**
- `reparingShop/src/receptionist/pages/ReceptionistDashboard.tsx`

---

## How It Works (Automatic Flow)

### Job Creation Flow:
```
1. User fills job form (name, mobile, car, KM)
   ↓
2. Frontend calls POST /api/jobs
   ↓
3. Backend jobService.createJob() automatically:
   - Checks if mobile exists in Customer DB
   - If exists: Updates vehicle & KM history
   - If new: Creates new customer with unique ID
   - Adds customerId to job
   - Links KM reading to job ID
   ↓
4. Job created with customer tracking ✅
```

### Job Completion Flow:
```
1. Job status changed to "Completed"
   ↓
2. Backend jobService.completeJob() automatically:
   - Updates customer.totalJobs += 1
   - Updates customer.totalSpent += grandTotal
   - Updates customer.lastVisit = now
   ↓
3. Customer stats updated ✅
```

---

## API Usage (Optional - For Frontend Enhancements)

### Check Customer History (Optional)
```javascript
// Before creating job, optionally check history
GET /api/customers/mobile/9876543210

Response:
{
    "success": true,
    "data": {
        "customerId": "CUST-2024-0001",
        "name": "Rajesh Kumar",
        "mobile": "9876543210",
        "totalJobs": 5,
        "totalSpent": 45000,
        "lastVisit": "2024-03-14",
        "vehicles": [{
            "carModel": "Maruti Swift",
            "carNumber": "DL01AB1234",
            "kmReadings": [
                { "km": 45000, "date": "2024-03-14", "jobId": "JOB-2024-005" },
                { "km": 42000, "date": "2024-01-10", "jobId": "JOB-2024-003" }
            ]
        }]
    }
}
```

### Get Vehicle KM History (Optional)
```javascript
GET /api/customers/vehicle-history/9876543210/DL01AB1234

// Shows all KM readings for this vehicle
// Can detect KM rollback fraud
```

---

## Benefits

1. ✅ **Zero Extra Work** - Works automatically with existing job creation
2. ✅ **No Duplicate Customers** - Mobile number ensures uniqueness
3. ✅ **Complete History** - All vehicles and KM readings tracked
4. ✅ **Fraud Detection** - Can detect KM rollback
5. ✅ **Customer Analytics** - Lifetime value tracking
6. ✅ **Better Service** - Know returning customers

---

## Testing

### Test Scenarios:
1. ✅ Create job with new mobile → New customer created
2. ✅ Create job with existing mobile → Customer updated, KM added
3. ✅ Same customer, different vehicle → New vehicle added to customer
4. ✅ Complete job → Customer stats updated
5. ✅ Check customer API → Returns complete history

### Test Commands:
```bash
# Create job (customer auto-created)
POST /api/jobs
{
    "customerName": "Rajesh Kumar",
    "mobile": "9876543210",
    "carModel": "Maruti Swift",
    "carNumber": "DL01AB1234",
    "kmDriven": 45000,
    ...
}

# Check customer was created
GET /api/customers/mobile/9876543210

# Create another job (customer auto-updated)
POST /api/jobs
{
    "customerName": "Rajesh Kumar",
    "mobile": "9876543210",
    "carModel": "Maruti Swift",
    "carNumber": "DL01AB1234",
    "kmDriven": 48000,  // New KM reading
    ...
}

# Verify KM history
GET /api/customers/vehicle-history/9876543210/DL01AB1234
```

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Customer Model | ✅ Complete | Auto-generates unique IDs |
| Customer Service | ✅ Complete | findOrCreateCustomer() |
| Customer Routes | ✅ Complete | Optional history APIs |
| Job Service Integration | ✅ Complete | Automatic on job create/complete |
| Job Model | ✅ Complete | customerId field added |
| Frontend Changes | ⚠️ Optional | Works without changes! |

---

## Conclusion

**System is READY TO USE!** 🎉

- No frontend changes required
- Customer tracking happens automatically
- Optional: Add UI to show customer history
- All 4 job creation points (Admin, Manager, Driver, Receptionist) work automatically

**Next Steps (Optional):**
1. Add "View Customer History" button in job forms
2. Show customer stats in receptionist dashboard
3. Add KM fraud detection alerts

