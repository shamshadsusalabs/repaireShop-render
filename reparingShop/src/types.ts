export type JobStatus =
    | 'Pending'
    | 'Assigned'
    | 'Inspection'
    | 'Approval'
    | 'Approved'
    | 'Rejected'
    | 'Parts Requested'
    | 'Repairing'
    | 'Completed';

export interface InspectionResult {
    partName: string;
    status: 'OK' | 'Not OK' | 'Pending';
    comment: string;
}

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

export interface IssuedPart {
    _id?: string;
    partId: string;
    partName: string;
    partNumber: string;
    quantityIssued: number;
    unitPrice: number;
    gstPercent?: number; // GST at which part was purchased
    hsnCode?: string; // HSN/SAC code
    issuedBy?: {
        _id: string;
        name: string;
        email: string;
    } | string;
    issuedAt: string;
}

export interface Job {
    jobId: string;
    customerName: string;
    customerId?: string;
    mobile: string;
    carModel: string;
    carNumber: string;
    kmDriven: number;
    carImages?: string[];
    jobType: 'Pickup' | 'Walk-in';
    location?: string;
    date: string;
    status: JobStatus;
    mechanicId?: string;
    driverId?: {
        _id: string;
        name: string;
        email: string;
        avatar: string;
    } | string | null;
    driverTask?: 'Pickup' | 'Drop' | null;
    inspectionResults: InspectionResult[];
    faultyParts: FaultyPart[];
    partsIssued?: IssuedPart[];
    approved?: boolean;
    gstPercent: number;
    grandTotal: number;
}

export interface Mechanic {
    _id: string;
    id: string;
    name: string;
    experience: string;
    specialty: string;
    avatar: string;
    available: boolean;
}

export interface Driver {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    isActive: boolean;
}

export interface InspectionItem {
    _id?: string;
    name: string;
    icon: string;
}

export interface CarModel {
    _id: string;
    brand: string;
    modelName: string;
}

export interface PurchaseOrder {
    _id: string;
    orderNumber?: string;
    storeId: {
        _id: string;
        name: string;
        email: string;
    } | string;
    vendorId: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        companyName?: string;
    } | string;
    partName: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    gstPercent: number;
    totalCost: number;

    notes?: string;
    createdAt: string;
    updatedAt: string;
}
