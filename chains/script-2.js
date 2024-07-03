const newman = require('newman'); 
const fs = require('fs').promises;

// generate a random record number
const generateRandomRecordNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `INV-${date}-${randomNumber}`;
};

// preprocess the input data file
const preprocessData = async (inputFile) => {
    try {
        // read the input file
        const data = await fs.readFile(inputFile, 'utf8');

        // parse the input JSON data
        let jsonData = JSON.parse(data);

        // Generate a unique record number
        const newRecordNumber = generateRandomRecordNumber();

        // Apply the new record number to the file
        jsonData[0].record_number = newRecordNumber;

        console.log(`Generated Record Number: ${newRecordNumber}`);

        // Write the preprocessed data to the output file
        await fs.writeFile(inputFile, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`Data has been preprocessed and saved to ${inputFile}`);

    } catch (error) {
        console.error(`Error in preprocessing data: ${error}`);
    }
};

// Run Newman collection and handle requests
const runNewman = async (inputFile) => {
    await newman.run({
        collection: require('./collection2.json'), // path to the Postman collection
        reporters: 'cli',
        iterationData: require(`./${inputFile}`), // path to the data file
    }).on('beforeRequest', async (error, data) => {
        if (error) {
            console.log(error);
            return;
        }

        if (data.item.name === 'Update Draft Record') {
            try {
                // Read the existing data file
                const fileData = await fs.readFile(inputFile, 'utf8');

                // Parse JSON data
                let jsonData = JSON.parse(fileData);

                // Get the record ID from the file
                const recordId = jsonData[0].record_id;

                // Print the recordId for debugging
                console.log(`Record ID for Update Draft Record: ${recordId}`);

                // Replace the recordId in the request URL
                const updatedUrl = data.request.url.toString().replace(':recordId', recordId);
                data.request.url = updatedUrl;

                // Print the updated URL for debugging
                console.log(`Updated URL for Update Draft Record: ${updatedUrl}`);
            } catch (error) {
                console.error(`Error in beforeRequest: ${error}`);
            }
        }
    }).on('request', async (error, data) => {
        if (error) {
            console.log(error);
            return;
        }

        const requestName = data.item.name.replace(/[^a-z0-9]/gi, '-');
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `response-${requestName}-${randomString}.txt`;
        const content = data.response.stream.toString();

        try {
            await fs.writeFile(fileName, content);
            console.log(`Response saved to ${fileName}`);
        } catch (error) {
            console.error(`Error writing response to file: ${error}`);
        }

        // Extract and save the record_id from the Create Draft Record response
        if (data.item.name === 'Create Draft Record') {
            try {
                const responseBody = JSON.parse(content);
                const recordId = responseBody.data.record.id;

                // Read the existing data filer
                const fileData = await fs.readFile(inputFile, 'utf8');

                // Parse JSON data
                let jsonData = JSON.parse(fileData);

                // Update the record_id in the file
                jsonData[0].record_id = recordId;

                // Write the updated data back to the file
                await fs.writeFile(inputFile, JSON.stringify(jsonData, null, 2), 'utf8');
                console.log(`Record ID has been saved to ${inputFile}`);
            } catch (error) {
                console.error(`Error processing Create Draft Record response: ${error}`);
            }
        }
    }).on('beforeRequest', (error, data) => {
        if (error) {
            console.log(error);
            return;
        }

        if (data.item.name === 'Update Draft Record') {
            // Print the request body for debugging
            const requestBody = data.request.body.raw;
            console.log(`Request Body for Update Draft Record: ${requestBody}`);
        }
    }).on('request', (error, data) => {
        if (error) {
            console.log(error);
            return;
        }

        // Print the response for debugging
        const responseBody = data.response.stream.toString();
        console.log(`Response Body for ${data.item.name}: ${responseBody}`);

        // Additional logic to handle the response...
    });
};

const inputFile = 'data.json';

// Preprocess the data and run Newman
(async () => {
    await preprocessData(inputFile);
    await runNewman(inputFile);
})();
