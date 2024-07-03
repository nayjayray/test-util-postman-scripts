const path = require('path');
const newman = require('newman');
const fs = require('fs');

// Function to run Newman with the specified collection and data file
const runNewman = (collectionFile, dataFile) => {
    newman.run({
        collection: require(collectionFile), // path to the Postman collection
        reporters: 'cli',
        iterationData: require(dataFile), // path to the data file
    }).on('request', (error, data) => {
        if (error) {
            console.log(error);
            return;
        }

        // Handle specific request events if needed
        if (data.item.name === 'Create Draft Record') {
            handleCreateDraftRecord(data, dataFile);
        } else if (data.item.name === 'Update Draft Record') {
            handleUpdateDraftRecord(data, dataFile);
        }
    });
};

// Function to handle Create Draft Record request
const handleCreateDraftRecord = (data, dataFile) => {
    try {
        const responseBody = JSON.parse(data.response.stream.toString());
        const recordId = responseBody.data.record.id;

        if (!recordId) {
            console.error('Error: Record ID not found in response.');
            return;
        }

        // Read the existing data file
        const jsonData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

        // Update the record_id in the file
        jsonData[0].record_id = recordId;

        // Write the updated data back to the file
        fs.writeFileSync(dataFile, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`Record ID has been saved to ${dataFile}`);

        // Run Newman again for the next request (Update Draft Record)
        runNewman('./collection.json', dataFile); // Adjust paths as necessary
    } catch (error) {
        console.error(`Error handling Create Draft Record: ${error}`);
    }
};

// Function to handle Update Draft Record request
const handleUpdateDraftRecord = (data, dataFile) => {
    try {
        // Read the existing data file
        const jsonData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

        // Retrieve the saved record_id from chain-test.json
        const recordId = jsonData[0].record_id;

        if (!recordId) {
            console.error('Error: Record ID not found in chain-test.json.');
            return;
        }

        // Update the URL of Update Draft Record request
        const newUrl = `https://dev2.ara-pay.com/development/ara/record/api/v2/payee/record/${recordId}`;
        data.request.url.update(newUrl); // Update the URL in Newman request

        // Optionally log the updated URL
        console.log(`Updated URL for Update Draft Record: ${newUrl}`);
    } catch (error) {
        console.error(`Error handling Update Draft Record: ${error}`);
    }
};

// Entry point: Run Newman for Create Draft Record request
const inputFile = path.resolve(__dirname, 'chain-test.json');
runNewman('./collection.json', inputFile); // Adjust paths as necessary
