// Temporary script to register the dev server as running
const projectId = '5142211c-9b7e-47d0-bf44-1baedb5e19a1';
const port = 5200;

// This would normally be done through the API, but we're simulating it
console.log(`Dev server for project ${projectId} is running on port ${port}`);
console.log(`URL: http://localhost:${port}`);

// The actual fix needs to be in the backend to properly track manually started servers