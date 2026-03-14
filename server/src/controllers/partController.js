const XLSX = require('xlsx');
const partService = require('../services/partService');

/**
 * @desc    Get all parts
 * @route   GET /api/parts
 * @access  Private (Store, Admin)
 */
const getAllParts = async (req, res, next) => {
    try {
        const result = await partService.getAllParts(req.query);
        res.status(200).json({
            success: true,
            count: result.parts.length,
            total: result.total,
            page: result.page,
            limit: result.limit,
            data: result.parts,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single part
 * @route   GET /api/parts/:id
 * @access  Private (Store, Admin)
 */
const getPartById = async (req, res, next) => {
    try {
        const part = await partService.getPartById(req.params.id);
        res.status(200).json({ success: true, data: part });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new part
 * @route   POST /api/parts
 * @access  Private (Store, Admin)
 */
const createPart = async (req, res, next) => {
    try {
        const part = await partService.createPart(req.body, req.user._id);
        res.status(201).json({
            success: true,
            message: 'Part created successfully',
            data: part,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a part
 * @route   PUT /api/parts/:id
 * @access  Private (Store, Admin)
 */
const updatePart = async (req, res, next) => {
    try {
        const part = await partService.updatePart(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: 'Part updated successfully',
            data: part,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a part
 * @route   DELETE /api/parts/:id
 * @access  Private (Store, Admin)
 */
const deletePart = async (req, res, next) => {
    try {
        await partService.deletePart(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Part deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload parts from Excel file
 * @route   POST /api/parts/upload-excel
 * @access  Private (Store, Admin)
 */
const uploadExcel = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an Excel file (.xlsx or .xls)',
            });
        }

        // Parse the Excel file from buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'The Excel file is empty or has no valid data',
            });
        }

        // Map Excel columns to our schema
        const mappedData = jsonData.map((row) => ({
            partName: row['Part Name'] || row['partName'] || row['name'] || row['Name'] || '',
            partNumber: row['Part Number'] || row['partNumber'] || row['Part No'] || row['PartNo'] || '',
            category: row['Category'] || row['category'] || 'Other',
            quantity: row['Quantity'] || row['quantity'] || row['Qty'] || row['qty'] || 0,
            minStock: row['Min Stock'] || row['minStock'] || row['Minimum Stock'] || 5,
            costPrice: row['Cost Price'] || row['costPrice'] || row['Cost'] || row['cost'] || 0,
            sellPrice: row['Sell Price'] || row['sellPrice'] || row['Price'] || row['price'] || row['MRP'] || 0,
            location: row['Location'] || row['location'] || row['Rack'] || row['rack'] || '',
            supplier: row['Supplier'] || row['supplier'] || row['Vendor'] || row['vendor'] || '',
            vehicleModel: row['Vehicle Model'] || row['vehicleModel'] || row['Car Model'] || row['Model'] || '',
            description: row['Description'] || row['description'] || row['Desc'] || '',
        }));

        const result = await partService.bulkCreateParts(mappedData, req.user._id);

        res.status(200).json({
            success: true,
            message: `Upload complete: ${result.success} parts processed, ${result.failed} failed`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get inventory stats/summary
 * @route   GET /api/parts/stats
 * @access  Private (Store, Admin)
 */
const getInventoryStats = async (req, res, next) => {
    try {
        const stats = await partService.getInventoryStats();
        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Download sample Excel template
 * @route   GET /api/parts/template
 * @access  Private (Store, Admin)
 */
const downloadTemplate = async (req, res, next) => {
    try {
        const sampleData = [
            {
                'Part Name': 'Brake Pad Set',
                'Part Number': 'BP-001',
                'Category': 'Brake',
                'Quantity': 10,
                'Min Stock': 5,
                'Cost Price': 800,
                'Sell Price': 1200,
                'Location': 'Rack A1',
                'Supplier': 'Brembo India',
                'Vehicle Model': 'Maruti Swift',
                'Description': 'Front brake pads set of 4',
            },
            {
                'Part Name': 'Oil Filter',
                'Part Number': 'OF-002',
                'Category': 'Filter',
                'Quantity': 25,
                'Min Stock': 10,
                'Cost Price': 150,
                'Sell Price': 300,
                'Location': 'Rack B2',
                'Supplier': 'Bosch India',
                'Vehicle Model': 'Hyundai i20',
                'Description': 'Engine oil filter',
            },
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(sampleData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
            { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
            { wch: 20 }, { wch: 20 }, { wch: 30 },
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Parts');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=parts_template.xlsx');
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllParts,
    getPartById,
    createPart,
    updatePart,
    deletePart,
    uploadExcel,
    getInventoryStats,
    downloadTemplate,
};
