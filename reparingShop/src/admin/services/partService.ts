import api from './api';

export interface Part {
    _id: string;
    partName: string;
    partNumber: string;
    category: string;
    quantity: number;
    minStock: number;
    costPrice: number;
    buyGstPercent: number;
    sellPrice: number;
    sellGstPercent: number;
    location: string;
    supplier: string;
    vehicleModel: string;
    description: string;
    isActive: boolean;
    addedBy?: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface InventoryStats {
    totalParts: number;
    totalQuantity: number;
    lowStockParts: number;
    outOfStock: number;
    categoryStats: Array<{
        _id: string;
        count: number;
        totalQty: number;
    }>;
    totalCostValue: number;
    totalSellValue: number;
}

export interface BulkUploadResult {
    success: number;
    failed: number;
    errors: Array<{
        row: number;
        error: string;
        data: Record<string, unknown>;
    }>;
    created: Part[];
}

export interface CreatePartPayload {
    partName: string;
    partNumber: string;
    category: string;
    quantity: number;
    minStock?: number;
    costPrice: number;
    sellPrice: number;
    location?: string;
    supplier?: string;
    vehicleModel?: string;
    description?: string;
}

const partService = {
    // Get all parts with optional filters
    getAllParts: (params?: Record<string, string>) =>
        api.get<{ success: boolean; count: number; total: number; data: Part[] }>('/parts', { params }),

    // Get single part
    getPartById: (id: string) =>
        api.get<{ success: boolean; data: Part }>(`/parts/${id}`),

    // Create a new part
    createPart: (payload: CreatePartPayload) =>
        api.post<{ success: boolean; message: string; data: Part }>('/parts', payload),

    // Update a part
    updatePart: (id: string, payload: Partial<CreatePartPayload>) =>
        api.put<{ success: boolean; message: string; data: Part }>(`/parts/${id}`, payload),

    // Delete a part
    deletePart: (id: string) =>
        api.delete<{ success: boolean; message: string }>(`/parts/${id}`),

    // Upload Excel file
    uploadExcel: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{ success: boolean; message: string; data: BulkUploadResult }>(
            '/parts/upload-excel',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
    },

    // Get inventory stats
    getStats: () =>
        api.get<{ success: boolean; data: InventoryStats }>('/parts/stats'),

    // Download template
    downloadTemplate: () =>
        api.get('/parts/template', { responseType: 'blob' }),
};

export default partService;
