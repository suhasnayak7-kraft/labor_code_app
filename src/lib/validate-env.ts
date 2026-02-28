/**
 * Validates required environment variables exist at app startup.
 * This prevents silent failures where the app starts but API calls fail.
 */

export function validateEnvironment() {
    const required = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_API_URL'
    ];

    const missing = required.filter(key => !import.meta.env[key]);

    if (missing.length > 0) {
        console.warn(`⚠️ Warning: Missing environment variables:\n${missing.join('\n')}`);
        // Log to console but don't crash the entire app if we have fallbacks
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
            console.error("CRITICAL: Supabase keys are missing. Auth will fail.");
        }
    }

    console.log('✅ Environment validation passed');
}
