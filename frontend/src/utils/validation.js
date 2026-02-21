import { z } from 'zod'

// ── Login ──
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(1, 'Password is required'),
})

// ── Registration ──
export const registerSchema = z.object({
    full_name: z
        .string()
        .min(2, 'Name must be at least 2 characters'),
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[0-9]/, 'Password must contain a number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
    confirmPassword: z.string(),
    role: z
        .string()
        .min(1, 'Please select a role'),
    terms: z
        .literal(true, { errorMap: () => ({ message: 'You must accept the terms to continue' }) }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
})

// ── Vehicle ──
export const vehicleSchema = z.object({
    name: z
        .string()
        .min(1, 'Vehicle name is required'),
    license_plate: z
        .string()
        .min(1, 'License plate is required'),
    type: z
        .enum(['Truck', 'Van', 'Bike'], { errorMap: () => ({ message: 'Please select a vehicle type' }) }),
    max_capacity_kg: z
        .string()
        .min(1, 'Capacity is required')
        .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Capacity must be a positive number'),
    odometer_km: z
        .string()
        .refine(v => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), 'Odometer must be a non-negative number')
        .optional()
        .or(z.literal('')),
    acquisition_cost: z
        .string()
        .refine(v => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), 'Cost must be a non-negative number')
        .optional()
        .or(z.literal('')),
    model: z.string().optional().or(z.literal('')),
})

// ── Driver ──
export const driverSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters'),
    license_number: z
        .string()
        .min(1, 'License number is required'),
    license_expiry: z
        .string()
        .min(1, 'License expiry date is required'),
})

// ── Trip ──
export const tripSchema = z.object({
    vehicle_id: z
        .string()
        .min(1, 'Please select a vehicle'),
    driver_id: z
        .string()
        .min(1, 'Please select a driver'),
    cargo_weight_kg: z
        .string()
        .min(1, 'Cargo weight is required')
        .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Cargo weight must be a positive number'),
    origin: z
        .string()
        .min(1, 'Origin is required'),
    destination: z
        .string()
        .min(1, 'Destination is required'),
    estimated_distance_km: z
        .string()
        .refine(v => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), 'Distance must be non-negative')
        .optional()
        .or(z.literal('')),
    revenue: z
        .string()
        .refine(v => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), 'Revenue must be non-negative')
        .optional()
        .or(z.literal('')),
    estimated_fuel_cost: z
        .string()
        .refine(v => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), 'Fuel cost must be non-negative')
        .optional()
        .or(z.literal('')),
})

// ── Maintenance ──
export const maintenanceSchema = z.object({
    vehicle_id: z
        .string()
        .min(1, 'Please select a vehicle'),
    service_type: z
        .string()
        .min(1, 'Please select a service type'),
    issue: z
        .string()
        .min(1, 'Issue description is required')
        .max(500, 'Issue must be under 500 characters'),
    cost: z
        .string()
        .refine(v => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), 'Cost must be non-negative')
        .optional()
        .or(z.literal('')),
    service_date: z
        .string()
        .min(1, 'Service date is required'),
    notes: z.string().optional().or(z.literal('')),
})

/**
 * Validate form data against a Zod schema.
 * @returns {{ success: boolean, data?: object, errors?: Record<string, string> }}
 */
export function validateForm(schema, data) {
    const result = schema.safeParse(data)
    if (result.success) {
        return { success: true, data: result.data }
    }
    const errors = {}
    for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        if (!errors[key]) {
            errors[key] = issue.message
        }
    }
    return { success: false, errors }
}
