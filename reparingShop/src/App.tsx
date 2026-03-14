import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import useAuthStore from './admin/store/authStore';
import AppLayout from './admin/components/Layout';

// Lazy load pages
const Login = lazy(() => import('./admin/pages/Login'));
const Dashboard = lazy(() => import('./admin/pages/Dashboard'));
const CreateJob = lazy(() => import('./admin/pages/CreateJob'));
const JobDetails = lazy(() => import('./admin/pages/JobDetails'));
const AssignMechanic = lazy(() => import('./admin/pages/AssignMechanic'));
const InspectionChecklist = lazy(() => import('./admin/pages/InspectionChecklist'));
const FaultList = lazy(() => import('./admin/pages/FaultList'));
const CustomerApproval = lazy(() => import('./admin/pages/CustomerApproval'));
const RepairCost = lazy(() => import('./admin/pages/RepairCost'));
const Invoice = lazy(() => import('./admin/pages/Invoice'));
const MechanicManagement = lazy(() => import('./admin/pages/MechanicManagement'));
const UserManagement = lazy(() => import('./admin/pages/UserManagement'));
const PublicJobApproval = lazy(() => import('./admin/pages/PublicJobApproval'));
const ManageInspectionItems = lazy(() => import('./admin/pages/ManageInspectionItems'));
const ManageCarModels = lazy(() => import('./admin/pages/ManageCarModels'));

// Manager Layout
const ManagerLayout = lazy(() => import('./manager/components/ManagerLayout'));

// Accountant Layout & Pages
const AccountantLayout = lazy(() => import('./accountant/components/AccountantLayout'));
const AccountantDashboard = lazy(() => import('./accountant/pages/AccountantDashboard'));

// Store Layout & Pages
const StoreLayout = lazy(() => import('./store/components/StoreLayout'));
const StoreDashboard = lazy(() => import('./store/pages/StoreDashboard'));
const InventoryPage = lazy(() => import('./store/pages/InventoryPage'));
const UploadPartsPage = lazy(() => import('./store/pages/UploadPartsPage'));
const PartsRequestsPage = lazy(() => import('./store/pages/PartsRequestsPage'));
const StoreOrders = lazy(() => import('./store/pages/StoreOrders'));

// Receptionist Layout & Pages
const ReceptionistLayout = lazy(() => import('./receptionist/components/ReceptionistLayout'));
const ReceptionistDashboard = lazy(() => import('./receptionist/pages/ReceptionistDashboard'));
const SendNotification = lazy(() => import('./receptionist/pages/SendNotification'));
const WhatsAppGroups = lazy(() => import('./receptionist/pages/WhatsAppGroups'));
const WhatsAppTemplates = lazy(() => import('./receptionist/pages/WhatsAppTemplates'));

// Vendor Layout & Pages
const VendorLayout = lazy(() => import('./vendor/components/VendorLayout'));
const VendorDashboard = lazy(() => import('./vendor/pages/VendorDashboard'));
const VendorOrders = lazy(() => import('./vendor/pages/VendorOrders'));
const VendorLogin = lazy(() => import('./vendor/pages/VendorLogin'));

// Shared Components
const PurchaseOrderInvoice = lazy(() => import('./shared/components/PurchaseOrderInvoice'));

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" />
    </div>
  );
}

/**
 * Admin Routes — full access to everything
 */
function AdminRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/approve/:jobId" element={<PublicJobApproval />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Dashboard />} />
          <Route path="/create-job" element={<CreateJob />} />
          <Route path="/job/:jobId" element={<JobDetails />} />
          <Route path="/job/:jobId/assign" element={<AssignMechanic />} />
          <Route path="/job/:jobId/inspection" element={<InspectionChecklist />} />
          <Route path="/job/:jobId/faults" element={<FaultList />} />
          <Route path="/job/:jobId/approval" element={<CustomerApproval />} />
          <Route path="/job/:jobId/repair-cost" element={<RepairCost />} />
          <Route path="/job/:jobId/invoice" element={<Invoice />} />
          <Route path="/mechanics" element={<MechanicManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/checklist-settings" element={<ManageInspectionItems />} />
          <Route path="/car-models" element={<ManageCarModels />} />
          {/* Catch-all: redirect back to dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

/**
 * Manager Routes — Everything except Inspection (mechanic does inspection)
 */
function ManagerRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<ManagerLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Dashboard />} />
          <Route path="/create-job" element={<CreateJob />} />
          <Route path="/job/:jobId" element={<JobDetails />} />
          <Route path="/job/:jobId/assign" element={<AssignMechanic />} />
          {/* No inspection route — mechanic does inspection */}
          <Route path="/job/:jobId/faults" element={<FaultList />} />
          <Route path="/job/:jobId/approval" element={<CustomerApproval />} />
          <Route path="/job/:jobId/repair-cost" element={<RepairCost />} />
          <Route path="/job/:jobId/invoice" element={<Invoice />} />
          <Route path="/checklist-settings" element={<ManageInspectionItems />} />
          <Route path="/car-models" element={<ManageCarModels />} />
          {/* Catch-all: redirect back to dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

/**
 * Accountant Routes — Only completed jobs + invoice
 */
function AccountantRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<AccountantLayout />}>
          <Route path="/" element={<AccountantDashboard />} />
          <Route path="/jobs" element={<AccountantDashboard />} />
          <Route path="/invoices" element={<AccountantDashboard />} />
          <Route path="/job/:jobId/invoice" element={<Invoice />} />
          {/* Catch-all: redirect back to accountant dashboard */}
          <Route path="*" element={<AccountantDashboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

/**
 * Store Routes — Inventory management, parts upload
 */
function StoreRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<StoreDashboard />} />
          <Route path="/dashboard" element={<StoreDashboard />} />
          <Route path="/parts-requests" element={<PartsRequestsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/upload" element={<UploadPartsPage />} />
          <Route path="/store-orders" element={<StoreOrders />} />
          <Route path="/order-invoice/:orderId" element={<PurchaseOrderInvoice role="store" />} />
          {/* Catch-all: redirect back to store dashboard */}
          <Route path="*" element={<StoreDashboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

/**
 * Receptionist Routes — Search records by number + assign drivers
 */
function ReceptionistRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<ReceptionistLayout />}>
          <Route path="/" element={<ReceptionistDashboard />} />
          <Route path="/search" element={<ReceptionistDashboard />} />
          <Route path="/send-notification" element={<SendNotification />} />
          <Route path="/whatsapp-groups" element={<WhatsAppGroups />} />
          <Route path="/whatsapp-templates" element={<WhatsAppTemplates />} />
          {/* Catch-all: redirect back to receptionist dashboard */}
          <Route path="*" element={<ReceptionistDashboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function VendorPortal() {
  const [vendorLoggedIn, setVendorLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    import('./vendor/store/vendorAuthStore').then((mod) => {
      const store = mod.default;
      store.getState().loadFromStorage();
      setVendorLoggedIn(store.getState().isLoggedIn);

      // Subscribe to auth changes so login/register triggers re-render
      store.subscribe((state) => {
        setVendorLoggedIn(state.isLoggedIn);
      });
    });
  }, []);

  if (vendorLoggedIn === null) {
    return <LoadingFallback />;
  }

  if (!vendorLoggedIn) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <VendorLogin />
      </Suspense>
    );
  }

  return <VendorRoutes />;
}

/**
 * Vendor Routes — Manage parts catalog and view store orders
 */
function VendorRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<VendorLayout />}>
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/orders" element={<VendorOrders />} />
          <Route path="/vendor/order-invoice/:orderId" element={<PurchaseOrderInvoice role="vendor" />} />
          {/* Catch-all: redirect back to vendor dashboard */}
          <Route path="*" element={<VendorDashboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function AppRoutes() {
  const { isLoggedIn, user, loadFromStorage } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // If path starts with /vendor, render vendor portal
  if (location.pathname.startsWith('/vendor')) {
    return <VendorPortal />;
  }

  if (!isLoggedIn) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    );
  }

  // Route based on user role
  const role = user?.role;

  switch (role) {
    case 'manager':
      return <ManagerRoutes />;
    case 'accountant':
      return <AccountantRoutes />;
    case 'store':
      return <StoreRoutes />;
    case 'receptionist':
      return <ReceptionistRoutes />;
    case 'admin':
    default:
      return <AdminRoutes />;
  }
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 10,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          colorBgContainer: '#ffffff',
          fontSize: 14,
        },
        components: {
          Table: {
            headerBg: '#f8fafc',
            rowHoverBg: '#f8fafc',
          },
          Card: {
            paddingLG: 24,
          },
        },
      }}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
}
