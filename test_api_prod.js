async function test() {
  try {
    console.log("Starting test against production");
    // 1. Get token
    const loginRes = await fetch('https://moldshop.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');
    const token = loginData.token;
    console.log("Got token");

    // 2. Fetch molds to get a valid mold ID
    const moldsRes = await fetch('https://moldshop.vercel.app/api/molds', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const moldsData = await moldsRes.json();
    const moldId = moldsData.molds[0]?.id;
    if (!moldId) throw new Error("No molds found");

    // 3. Try creating a maintenance request using FormData for multipart/form-data
    console.log("Sending POST request to create maintenance request");
    const formData = new FormData();
    formData.append('moldId', moldId);
    formData.append('type', 'repair');
    formData.append('description', 'Test API Call JSON');
    formData.append('reportDate', '2026-03-02');
    formData.append('productionDate', '2026-03-05');

    const requestRes = await fetch('https://moldshop.vercel.app/api/maintenance', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData // fetch automatically sets the correct Content-Type for FormData
    });

    const reqData = await requestRes.json();
    if (!requestRes.ok) {
      console.log("API Error Status:", requestRes.status);
      console.log("API Error Data:", reqData);
    } else {
      console.log("Success:", reqData);
    }

  } catch (err) {
    console.error("Test Error:", err.message);
  }
}

test();
