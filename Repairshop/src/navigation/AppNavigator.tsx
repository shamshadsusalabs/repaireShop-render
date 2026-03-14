import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../store/authStore';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import AssignedJobsScreen from '../screens/AssignedJobsScreen';
import JobDetailsScreen from '../screens/JobDetailsScreen';
import InspectionScreen from '../screens/InspectionScreen';
import DriverCreateJobScreen from '../screens/DriverCreateJobScreen';

// Manager screens
import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen';
import ManagerCreateJobScreen from '../screens/manager/ManagerCreateJobScreen';
import ManagerJobDetailsScreen from '../screens/manager/ManagerJobDetailsScreen';
import ManagerAssignMechanicScreen from '../screens/manager/ManagerAssignMechanicScreen';
import ManagerFaultListScreen from '../screens/manager/ManagerFaultListScreen';
import ManagerCustomerApprovalScreen from '../screens/manager/ManagerCustomerApprovalScreen';
import ManagerRepairCostScreen from '../screens/manager/ManagerRepairCostScreen';
import ManagerInvoiceScreen from '../screens/manager/ManagerInvoiceScreen';

export type RootStackParamList = {
    Login: undefined;
    // Mechanic screens
    AssignedJobs: undefined;
    JobDetails: { jobId: string };
    Inspection: { jobId: string };
    // Driver screens
    DriverCreateJob: undefined;
    // Manager screens
    ManagerDashboard: undefined;
    ManagerCreateJob: undefined;
    ManagerJobDetails: { jobId: string };
    ManagerAssignMechanic: { jobId: string };
    ManagerFaultList: { jobId: string };
    ManagerCustomerApproval: { jobId: string };
    ManagerRepairCost: { jobId: string };
    ManagerInvoice: { jobId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const { isLoggedIn, initialLoading, loadFromStorage, appRole } = useAuthStore();

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    if (initialLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.primaryDark,
                }}>
                <ActivityIndicator size="large" color={colors.white} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.white,
                },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
                headerShadowVisible: false,
                contentStyle: {
                    backgroundColor: colors.background,
                },
                animation: 'slide_from_right',
            }}>
            {!isLoggedIn ? (
                // Auth Stack
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
            ) : appRole === 'driver' ? (
                // Driver Stack — only create pickup jobs
                <Stack.Screen
                    name="DriverCreateJob"
                    component={DriverCreateJobScreen}
                    options={{ headerShown: false }}
                />
            ) : appRole === 'manager' ? (
                // Manager Stack — full management capabilities
                <>
                    <Stack.Screen
                        name="ManagerDashboard"
                        component={ManagerDashboardScreen}
                        options={{
                            title: 'Dashboard',
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="ManagerCreateJob"
                        component={ManagerCreateJobScreen}
                        options={{
                            title: 'Create New Job',
                        }}
                    />
                    <Stack.Screen
                        name="ManagerJobDetails"
                        component={ManagerJobDetailsScreen}
                        options={{
                            title: 'Job Details',
                        }}
                    />
                    <Stack.Screen
                        name="ManagerAssignMechanic"
                        component={ManagerAssignMechanicScreen}
                        options={{
                            title: 'Assign Mechanic',
                        }}
                    />
                    <Stack.Screen
                        name="ManagerFaultList"
                        component={ManagerFaultListScreen}
                        options={{
                            title: 'Faulty Parts',
                        }}
                    />
                    <Stack.Screen
                        name="ManagerCustomerApproval"
                        component={ManagerCustomerApprovalScreen}
                        options={{
                            title: 'Customer Approval',
                        }}
                    />
                    <Stack.Screen
                        name="ManagerRepairCost"
                        component={ManagerRepairCostScreen}
                        options={{
                            title: 'Repair & Cost',
                        }}
                    />
                    <Stack.Screen
                        name="ManagerInvoice"
                        component={ManagerInvoiceScreen}
                        options={{
                            title: 'Invoice',
                        }}
                    />
                </>
            ) : (
                // Mechanic Stack
                <>
                    <Stack.Screen
                        name="AssignedJobs"
                        component={AssignedJobsScreen}
                        options={{
                            title: 'My Jobs',
                            headerStyle: {
                                backgroundColor: colors.background,
                            },
                        }}
                    />
                    <Stack.Screen
                        name="JobDetails"
                        component={JobDetailsScreen}
                        options={{
                            title: 'Job Details',
                        }}
                    />
                    <Stack.Screen
                        name="Inspection"
                        component={InspectionScreen}
                        options={{
                            title: 'Inspection',
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}
