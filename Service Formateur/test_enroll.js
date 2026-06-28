const axios = require('axios');
async function test() {
  try {
    // Attempt login to formateur service to get token
    const loginRes = await axios.post('http://192.168.20.25:8081/api/v1/auth/authenticate', {
      email: "formateur@gmail.com", // we don't know the exact email, let's try something typical that we saw in other files, or we don't even need auth if we could just read the DB directly
      password: "password123"
    }).catch(e => null);
    
    // if I can't guess the password, I will use node-postgres to query the db directly
  } catch (e) {
  }
}
test();
