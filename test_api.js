const axios = require('axios');
const fs = require('fs');

async function test() {
  try {
    const data = fs.readFileSync('/Users/anas/Desktop/PFE 4/Service Formateur/localStorage.json', 'utf8');
    // We can't do this easily if localStorage isn't saved as a file.
  } catch (e) {}
}
test();
