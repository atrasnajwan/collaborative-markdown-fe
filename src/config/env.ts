interface Config {
    apiUrl: string
    port: number
}

export const config: Config = {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    port: Number(import.meta.env.VITE_PORT) || 5173,
};

// Validate required environment variables
const requiredEnvVars = ['VITE_API_URL'];

for (const envVar of requiredEnvVars) {
    if (!(envVar in import.meta.env)) {
        console.warn(`Warning: ${envVar} environment variable is not set`);
    }
} 