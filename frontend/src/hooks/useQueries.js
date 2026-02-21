import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, retireVehicle } from '../api/vehicles'
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../api/drivers'
import { getTrips, createTrip, updateTripStatus } from '../api/trips'
import { getLogs, getStats, createLog, updateLog, resolveLog, deleteLog } from '../api/maintenance'
import { getDashboardStats } from '../api/analytics'

// ── Vehicles ──
export function useVehicles(filters = {}) {
    return useQuery({
        queryKey: ['vehicles', filters],
        queryFn: () => getVehicles(filters),
    })
}

export function useCreateVehicle() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createVehicle,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
    })
}

export function useUpdateVehicle() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }) => updateVehicle(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
    })
}

export function useDeleteVehicle() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteVehicle,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
    })
}

export function useRetireVehicle() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: retireVehicle,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
    })
}

// ── Drivers ──
export function useDrivers(filters = {}) {
    return useQuery({
        queryKey: ['drivers', filters],
        queryFn: () => getDrivers(filters),
    })
}

export function useCreateDriver() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createDriver,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
    })
}

export function useUpdateDriver() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }) => updateDriver(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
    })
}

export function useDeleteDriver() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteDriver,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
    })
}

// ── Trips ──
export function useTrips(filters = {}) {
    return useQuery({
        queryKey: ['trips', filters],
        queryFn: () => getTrips(filters),
    })
}

export function useCreateTrip() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createTrip,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['trips'] })
            qc.invalidateQueries({ queryKey: ['vehicles'] })
            qc.invalidateQueries({ queryKey: ['drivers'] })
            qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
    })
}

export function useUpdateTripStatus() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, status, finalOdometer, actualDistance, actualFuelCost }) =>
            updateTripStatus(id, status, finalOdometer, actualDistance, actualFuelCost),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['trips'] })
            qc.invalidateQueries({ queryKey: ['vehicles'] })
            qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
    })
}

// ── Maintenance ──
export function useMaintenance(params = {}) {
    return useQuery({
        queryKey: ['maintenance', params],
        queryFn: () => getLogs(params),
    })
}

export function useMaintenanceStats() {
    return useQuery({
        queryKey: ['maintenance-stats'],
        queryFn: () => getStats(),
    })
}

export function useCreateMaintenance() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createLog,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['maintenance'] })
            qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
            qc.invalidateQueries({ queryKey: ['vehicles'] })
        },
    })
}

export function useUpdateMaintenance() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }) => updateLog(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['maintenance'] })
            qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
        },
    })
}

export function useResolveMaintenance() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: resolveLog,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['maintenance'] })
            qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
            qc.invalidateQueries({ queryKey: ['vehicles'] })
        },
    })
}

export function useDeleteMaintenance() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteLog,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['maintenance'] })
            qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
        },
    })
}

// ── Dashboard ──
export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: getDashboardStats,
        refetchInterval: 5000,
    })
}
