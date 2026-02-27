/**
 * Validates required environment variables exist at app startup.
 * This prevents silent failures where the app starts but API calls fail.
 */

export function validateEnvironment() {
    const required = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_API_BASE_URL'
    ];

    const missing = required.filter(key => !import.meta.env[key]);

    if (missing.length > 0) {
        console.error(`❌ Missing required environment variables:\n${missing.join('\n')}`);
        // In a CSR app, throwing might crash the entire page before the error boundary loads.
        // For now, logging to console is safer if we just want it known by devs.
        // But since this is a security checklist recommendation to fail fast, we throw.
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    console.log('✅ Environment validation passed');
}
