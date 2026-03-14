import { useState } from 'react';
import {
    Card, Button, Upload, message, Table, Tag, Alert, Result, Space, Divider,
} from 'antd';
import {
    CloudUploadOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    InboxOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import usePartStore from '../../admin/store/partStore';
import type { BulkUploadResult } from '../../admin/services/partService';

const { Dragger } = Upload;

export default function UploadPartsPage() {
    const { uploadExcel, uploading, downloadTemplate } = usePartStore();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [rawFile, setRawFile] = useState<File | null>(null);
    const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);

    const handleUpload = async () => {
        if (!rawFile) {
            message.warning('Please select an Excel file first');
            return;
        }

        const file = rawFile;

        const result = await uploadExcel(file);
        if (result) {
            setUploadResult(result);
            if (result.failed === 0) {
                message.success(`✅ All ${result.success} parts uploaded successfully!`);
            } else {
                message.warning(`${result.success} parts uploaded, ${result.failed} failed`);
            }
            setFileList([]);
            setRawFile(null);
        } else {
            message.error('Upload failed. Please check the file format.');
        }
    };

    const handleDownloadTemplate = async () => {
        await downloadTemplate();
        message.success('Template downloaded! Fill it with your parts data.');
    };

    const errorColumns = [
        {
            title: 'Row #',
            dataIndex: 'row',
            key: 'row',
            width: 80,
            render: (v: number) => <Tag color="red" style={{ borderRadius: 6, fontWeight: 700 }}>{v}</Tag>,
        },
        {
            title: 'Error',
            dataIndex: 'error',
            key: 'error',
            render: (v: string) => <span style={{ color: '#ef4444', fontWeight: 500 }}>{v}</span>,
        },
        {
            title: 'Data',
            dataIndex: 'data',
            key: 'data',
            render: (v: Record<string, unknown>) => (
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                    {JSON.stringify(v).slice(0, 100)}...
                </span>
            ),
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>📤 Upload Parts</h1>
                <p>Bulk upload parts from an Excel spreadsheet (.xlsx or .xls)</p>
            </div>

            {/* Instructions Card */}
            <Card
                style={{
                    marginBottom: 24,
                    background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                    border: '1px solid #c7d2fe',
                    cursor: 'default',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'rgba(79,70,229,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28,
                    }}>
                        <FileExcelOutlined style={{ color: '#4f46e5' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: '#1e1b4b' }}>
                            How to Upload Parts
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: 13, color: '#475569' }}>
                            <div>📥 <strong>Step 1:</strong> Download the Excel template</div>
                            <div>📝 <strong>Step 2:</strong> Fill in your parts data</div>
                            <div>📤 <strong>Step 3:</strong> Upload the filled Excel file</div>
                            <div>✅ <strong>Step 4:</strong> Review the upload results</div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <Tag color="blue" style={{ borderRadius: 6 }}>Required Columns: Part Name, Part Number, Cost Price, Sell Price</Tag>
                            <Tag color="purple" style={{ borderRadius: 6, marginLeft: 4 }}>Duplicate Part Numbers? Quantity will be added to existing</Tag>
                        </div>
                    </div>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadTemplate}
                        size="large"
                        style={{
                            borderRadius: 12,
                            height: 48,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg,#1e1b4b,#4f46e5)',
                            border: 'none',
                        }}
                    >
                        Download Template
                    </Button>
                </div>
            </Card>

            {/* Upload Area */}
            <Card
                title={
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        <CloudUploadOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                        Upload Excel File
                    </span>
                }
                style={{ marginBottom: 24, cursor: 'default' }}
            >
                <Dragger
                    name="file"
                    fileList={fileList}
                    beforeUpload={(file) => {
                        const isExcel =
                            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                            file.type === 'application/vnd.ms-excel' ||
                            file.name.endsWith('.xlsx') ||
                            file.name.endsWith('.xls') ||
                            file.name.endsWith('.csv');

                        if (!isExcel) {
                            message.error('Only Excel files (.xlsx, .xls) are allowed!');
                            return Upload.LIST_IGNORE;
                        }

                        // Store the raw File object for upload
                        setRawFile(file);
                        setFileList([{
                            uid: file.name,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            originFileObj: file,
                        } as UploadFile]);
                        setUploadResult(null);
                        return false; // Prevent auto upload
                    }}
                    onRemove={() => {
                        setFileList([]);
                        setRawFile(null);
                        setUploadResult(null);
                    }}
                    maxCount={1}
                    accept=".xlsx,.xls,.csv"
                    style={{
                        padding: '40px 20px',
                        borderRadius: 16,
                        border: '2px dashed #c7d2fe',
                        background: '#fafafe',
                    }}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#4f46e5', fontSize: 52 }} />
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '8px 0' }}>
                        Click or drag Excel file here to upload
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>
                        Supports .xlsx, .xls files • Max 10MB • First sheet will be processed
                    </p>
                </Dragger>

                {fileList.length > 0 && (
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                        <Button
                            type="primary"
                            icon={<CloudUploadOutlined />}
                            onClick={handleUpload}
                            loading={uploading}
                            size="large"
                            style={{
                                height: 52,
                                minWidth: 240,
                                borderRadius: 14,
                                fontWeight: 700,
                                fontSize: 16,
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: 'none',
                                boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                            }}
                        >
                            {uploading ? 'Uploading...' : `Upload ${fileList[0]?.name}`}
                        </Button>
                    </div>
                )}
            </Card>

            {/* Upload Results */}
            {uploadResult && (
                <Card
                    title={
                        <span style={{ fontSize: 18, fontWeight: 700 }}>
                            📊 Upload Results
                        </span>
                    }
                    style={{ cursor: 'default' }}
                >
                    <Result
                        status={uploadResult.failed === 0 ? 'success' : 'warning'}
                        title={
                            uploadResult.failed === 0
                                ? `All ${uploadResult.success} parts uploaded successfully!`
                                : `${uploadResult.success} uploaded, ${uploadResult.failed} failed`
                        }
                        subTitle={
                            uploadResult.failed > 0
                                ? 'Some rows had issues. Check the error details below.'
                                : 'All parts have been added to your inventory.'
                        }
                        extra={
                            <Space>
                                <Tag
                                    icon={<CheckCircleOutlined />}
                                    color="green"
                                    style={{ fontSize: 14, padding: '4px 16px', borderRadius: 8, fontWeight: 700 }}
                                >
                                    {uploadResult.success} Success
                                </Tag>
                                {uploadResult.failed > 0 && (
                                    <Tag
                                        icon={<CloseCircleOutlined />}
                                        color="red"
                                        style={{ fontSize: 14, padding: '4px 16px', borderRadius: 8, fontWeight: 700 }}
                                    >
                                        {uploadResult.failed} Failed
                                    </Tag>
                                )}
                            </Space>
                        }
                    />

                    {uploadResult.errors.length > 0 && (
                        <>
                            <Divider />
                            <Alert
                                message="Error Details"
                                description="The following rows had errors and were not uploaded:"
                                type="error"
                                showIcon
                                style={{ marginBottom: 16, borderRadius: 10 }}
                            />
                            <Table
                                dataSource={uploadResult.errors.map((e, i) => ({ ...e, key: i }))}
                                columns={errorColumns}
                                pagination={false}
                                size="small"
                            />
                        </>
                    )}
                </Card>
            )}
        </div>
    );
}
