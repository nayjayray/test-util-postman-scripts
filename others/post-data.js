const fs = require('fs');

// Read the Newman output file
const output = JSON.parse(fs.readFileSync('output.json', 'utf8'));

// Extract the record ID from the environment
const recordId = output.run.executions.reduce((acc, exec) => {
    if (exec.assertions) {
        exec.assertions.forEach(assertion => {
            if (assertion.assertion === "New record ID exists") {
                const envVars = exec.environment.values.filter(envVar => envVar.key === 'record_id');
                if (envVars.length > 0) {
                    acc.push(envVars[0].value);
                }
            }
        });
    }
    return acc;
}, []);

// Save the extracted record IDs to a JSON file
fs.writeFileSync('record_ids.json', JSON.stringify(recordId, null, 2));
