const https = require('https');
const jwt = require('jsonwebtoken');

const API_URL = 'https://moldshop.vercel.app/api';
// Generate a fake but valid-format JWT token (the backend only verifies the secret)
const token = jwt.sign(
    { id: 1, username: 'admin', role: 'admin', employeeId: '001' },
    'mynutsmurf11', // This must match the process.env.JWT_SECRET on Vercel
    { expiresIn: '8h' }
);

const HEADERS = {
    'Authorization': `Bearer ${token}`
};

const ENDPOINTS = [
    '/health',
    '/molds',
    '/dashboard/stats',
    '/work-orders'
];

async function hitEndpoint(url) {
    return new Promise((resolve) => {
        const start = Date.now();
        https.get(`${API_URL}${url}`, { headers: HEADERS }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    time: Date.now() - start,
                    url
                });
            });
        }).on('error', (err) => {
            resolve({
                status: 'ERROR',
                time: Date.now() - start,
                url,
                message: err.message
            });
        });
    });
}

async function runTest() {
    console.log(`Starting load test against ${API_URL}...`);
    const TOTAL_REQUESTS = 200;
    const CONCURRENCY = 20; // High concurrency to trigger pool exhaustion

    let success = 0;
    let errors = 0;
    let timeOuts = 0;

    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
        const batch = [];
        for (let j = 0; j < CONCURRENCY; j++) {
            const endpoint = ENDPOINTS[j % ENDPOINTS.length];
            batch.push(hitEndpoint(endpoint));
        }

        const results = await Promise.all(batch);
        results.forEach(res => {
            if (res.status >= 200 && res.status < 400) {
                success++;
            } else if (res.status === 401 || res.status === 403) {
                success++; // Auth failure is fine for this test, it means the server responded
            } else if (res.status === 504 || res.time > 10000) {
                timeOuts++;
                console.error(`TIMEOUT (${res.status}):`, res.url, `${res.time}ms`);
            } else {
                errors++;
                console.error(`ERROR (${res.status}):`, res.url, `${res.time}ms`);
            }
        });
    }

    console.log('--- Test Complete ---');
    console.log(`Success: ${success}`);
    console.log(`Errors (500/Crash): ${errors}`);
    console.log(`Timeouts (504): ${timeOuts}`);

    const errRate = ((errors + timeOuts) / TOTAL_REQUESTS) * 100;
    console.log(`Failure Rate: ${errRate.toFixed(2)}%`);
}

runTest();
