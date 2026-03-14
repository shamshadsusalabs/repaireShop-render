import { useState, useEffect } from 'react';
import { Radio, Input, Button, message, Tag } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';
import useInspectionItemStore from '../store/inspectionItemStore';
import type { InspectionResult } from '../../types';

export default function InspectionChecklist() {
    const { jobId } = useParams<{ jobId: string }>();
    const { saveInspection, loading: jobLoading } = useJobStore();
    const { items, fetchItems, loading: itemsLoading } = useInspectionItemStore();
    const navigate = useNavigate();

    const [results, setResults] = useState<InspectionResult[]>([]);

    // Fetch dynamic inspection items
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Initialize results when items are loaded
    useEffect(() => {
        if (items.length > 0 && results.length === 0) {
            setResults(
                items.map(item => ({
                    partName: item.name,
                    status: 'Pending',
                    comment: '',
                }))
            );
        }
    }, [items, results.length]);

    const updateResult = (index: number, field: 'status' | 'comment', value: string) => {
        setResults(prev =>
            prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
        );
    };

    const completedCount = results.filter(r => r.status !== 'Pending').length;
    const allCompleted = completedCount === results.length;

    const handleSubmit = async () => {
        if (!allCompleted) {
            message.warning('Please inspect all items before submitting');
            return;
        }

        try {
            await saveInspection(jobId || '', results);
            message.success('Inspection completed! Proceeding to fault list...');
            navigate(`/job/${jobId}/faults`);
        } catch {
            message.error('Failed to save inspection');
        }
    };

    if (itemsLoading) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Loading inspection checklist...</div>;
    }

    if (items.length === 0) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <h3>No inspection items configured.</h3>
                <p>Please contact the Admin or Manager to setup the inspection checklist.</p>
                <Button onClick={() => navigate(`/job/${jobId}`)}>Back to Job</Button>
            </div>
        );
    }

    return (
        <div className="fade-in-up">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/job/${jobId}`)}
                style={{ fontWeight: 600, marginBottom: 8 }}
            >
                Back to Job
            </Button>

            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Inspection Checklist</h1>
                        <p>Inspect each component for <strong>{jobId}</strong></p>
                    </div>
                    <Tag
                        color={allCompleted ? 'green' : 'orange'}
                        style={{ fontSize: 14, padding: '6px 16px' }}
                    >
                        {completedCount}/{results.length} Inspected
                    </Tag>
                </div>
            </div>

            <div style={{ maxWidth: 800 }}>
                {results.map((result, index) => {
                    // Match the correct item definition by name or index
                    const item = items.find(i => i.name === result.partName) || items[index];
                    return (
                        <div key={index} className="inspection-row" style={{
                            borderLeftWidth: 4,
                            borderLeftColor:
                                result.status === 'OK' ? '#10b981' :
                                    result.status === 'Not OK' ? '#ef4444' : '#e2e8f0',
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 12,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 28 }}>{item.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 16 }}>{result.partName}</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            {result.status === 'Pending' ? 'Not inspected yet' :
                                                result.status === 'OK' ? '✅ Working fine' : '❌ Issue found'}
                                        </div>
                                    </div>
                                </div>

                                <Radio.Group
                                    value={result.status}
                                    onChange={e => updateResult(index, 'status', e.target.value)}
                                    optionType="button"
                                    buttonStyle="solid"
                                    options={[
                                        { label: '✓ OK', value: 'OK' },
                                        { label: '✗ Not OK', value: 'Not OK' },
                                    ]}
                                />
                            </div>

                            <Input.TextArea
                                placeholder="Add comment (optional)..."
                                value={result.comment}
                                onChange={e => updateResult(index, 'comment', e.target.value)}
                                rows={1}
                                style={{ marginTop: 12, borderRadius: 8, resize: 'none' }}
                            />
                        </div>
                    );
                })}

                <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    size="large"
                    block
                    onClick={handleSubmit}
                    disabled={!allCompleted}
                    loading={jobLoading}
                    style={{ marginTop: 20, height: 50 }}
                >
                    Submit Inspection & View Faults
                </Button>
            </div>
        </div>
    );
}
