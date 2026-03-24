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
    procurementGST?: number;
    hsnCode?: string;
}

export interface IssuedPart {
    _id?: string;
    partId: string;
    partName: string;
    partNumber: string;
    quantityIssued: number;
    unitPrice: number;
    gstPercent?: number;
    hsnCode?: string;
    issuedBy?: {
        _id: string;
        name: string;
        email: string;
    } | string;
    issuedAt: string;
}

export interface MechanicUser {
    id: string;
    mechanicId: string;
    name: string;
    email: string;
    role: 'mechanic';
    specialty: string;
    avatar: string;
}

export interface DriverUser {
    id: string;
    name: string;
    email: string;
    role: 'driver';
    avatar: string;
}

export interface ManagerUser {
    id: string;
    name: string;
    email: string;
    role: 'manager';
    avatar: string;
}

// Union type for any app user
export type AppUser = MechanicUser | DriverUser | ManagerUser;

export interface Job {
    _id: string;
    jobId: string;
    customerName: string;
    mobile: string;
    carModel: string;
    carNumber: string;
    kmDriven: number;
    carImage?: string;
    jobType?: 'Pickup' | 'Walk-in';
    location?: string;
    date: string;
    status: JobStatus;
    mechanicId?: {
        _id: string;
        name: string;
        specialty: string;
        avatar: string;
        experience?: string;
        available?: boolean;
    };
    inspectionResults: InspectionResult[];
    faultyParts: FaultyPart[];
    partsIssued?: IssuedPart[];
    approved?: boolean;
    gstPercent: number;
    grandTotal: number;
    createdAt: string;
    updatedAt: string;
}

export interface Mechanic {
    _id: string;
    mechanicId: string;
    name: string;
    email: string;
    experience: string;
    specialty: string;
    avatar: string;
    available: boolean;
    mobile: string;
}

export interface InspectionItem {
    name: string;
    icon: string;
}
