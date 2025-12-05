import axios from 'axios';

async function inspectGamma() {
    console.log("Testing Gamma API Structure...");
    try {
        const response = await axios.get('https://gamma-api.polymarket.com/events', {
            params: {
                limit: 1,
                active: true,
                closed: false,
                order: 'createdAt', 
                ascending: false
            }
        });
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
        if (data.length > 0) {
            console.log(JSON.stringify(data[0], null, 2));
        }
    } catch (e) {
        console.error("Gamma Error:", e.message);
    }
}

inspectGamma();
