const newman = require('newman');
const fs = require('fs').promises; // Use fs.promises for async/await

// Generate a random record number
const generateRandomRecordNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `INV-${date}-${randomNumber}`;
};

// Preprocess the input data file
const preprocessData = async (inputFile) => {
    try {
        // Read the input file
        const data = await fs.readFile(inputFile, 'utf8');

        // Parse the input JSON data
        let jsonData = JSON.parse(data);

        // Generate a unique record number
        const newRecordNumber = generateRandomRecordNumber();

        // Apply the new record number to the file
        jsonData[0].record_number = newRecordNumber;

        console.log(`"Log -> The generated record number is: ${newRecordNumber}"`);

        // Write the preprocessed data to the output file
        await fs.writeFile(inputFile, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`"Log -> Data has been preprocessed and saved to: ${inputFile}"`);

    } catch (error) {
        console.error(`"Error -> Error in preprocessing data: ${error}"`);
    }
};

const inputFile = 'data.json';

// Run Newman
const runNewman = (inputFile) => {
    newman.run({
        collection: require('./collection2.json'), // Path to the Postman collection
        reporters: 'cli',
        iterationData: require(`./${inputFile}`), // Path to the data file
    }).on('request', async (error, data) => {
        if (error) {
            console.log(`"Log -> Error in on.request event: ${error}"`);
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
            console.error(`"Error -> Error writing response to file: ${error}"`);
        }

        // Extract and save the record_id from the Create Draft Record response
        if (data.item.name === 'Create Draft Record') {
            let responseBody;
            try {
                responseBody = JSON.parse(content);
            } catch (parseErr) {
                console.error(`"Error -> Error parsing response body: ${parseErr}"`);
                return;
            }

            if (responseBody.data && responseBody.data.record) {
                const recordId = responseBody.data.record.id;

                // Read the existing data file
                try {
                    const fileData = await fs.readFile(inputFile, 'utf8');
                    let jsonData = JSON.parse(fileData);

                    // Update the record_id in the file
                    jsonData[0].record_id = recordId;

                    // Write the updated data back to the file
                    await fs.writeFile(inputFile, JSON.stringify(jsonData, null, 2), 'utf8');
                    console.log(`"Log -> Record ID has been saved to: ${inputFile}"`);
                } catch (err) {
                    console.error(`"Error -> Error in updating record_id in data.json file: ${err}"`);
                }
            } else {
                console.error(`"Error -> Unexpected response structure: ${JSON.stringify(responseBody)}"`);
            }
            await(2000);
        }
    }).on('beforeItem', async (error, data) => {
        if (error) {
            console.log(`"Log -> Error in on.beforeItem event: ${error}"`);
            return;
        }

        if (data.item.name === 'Update Draft Record') {
            try {
                // Read the existing data file
                const fileData = await fs.readFile(inputFile, 'utf8');

                // Parse JSON data
                const jsonData = JSON.parse(fileData);

                // Get the record ID from the file
                const recordId = jsonData[0].record_id;

                // Print the recordId for debugging
                console.log(`"Log -> Record ID for Update Draft Record: ${recordId}"`);

                // Replace the recordId in the request URL
                const updatedUrl = data.item.request.url.toString().replace(':recordId', recordId);

                data.item.request.url = updatedUrl;

                // Print the updated URL for debugging
                console.log(`"Log -> Updated URL for Update Draft Record: ${updatedUrl}"`);
            } catch (err) {
                console.error(`"Error -> Error processing Update Draft Record request: ${err}"`);
            }
        }

        if (data.item.name === 'Delete Draft Record') {
            try {
                // Read the existing data file
                const fileData = await fs.readFile(inputFile, 'utf8');

                // Parse JSON data
                const jsonData = JSON.parse(fileData);

                // Get the record ID and business ID from the file
                const recordId = jsonData[0].record_id;
                const businessId = jsonData[0].business_id;

                // Replace variables in the request body
                const requestBody = JSON.parse(data.item.request.body.raw);
                requestBody.record_ids = [recordId];
                requestBody.business_id = businessId;

                // Update the request body with new values
                data.item.request.body.raw = JSON.stringify(requestBody);

                // Print the updated request body for debugging
                console.log(`"Log -> Updated request body for Delete Draft Record: ${JSON.stringify(requestBody)}"`);
            } catch (err) {
                console.error(`"Error -> Error processing Delete Draft Record request: ${err}"`);
            }
        }

        if (data.item.name === 'Get All Records') {
            try {
                // Read the existing data file
                const fileData = await fs.readFile(inputFile, 'utf8');

                // Parse JSON data
                const jsonData = JSON.parse(fileData);

                // Get the record ID from the file
                const businessId = jsonData[0].business_id;

                // Print the recordId for debugging
                console.log(`"Log -> Business ID for Get All Records: ${businessId}"`);

                // Replace the recordId in the request URL
                const updatedUrl = data.item.request.url.toString().replace(':businessId', businessId);

                data.item.request.url = updatedUrl;

                // Print the updated URL for debugging
                console.log(`"Log -> Updated URL for Get All Records: ${updatedUrl}"`);
            } catch (err) {
                console.error(`"Error -> Error processing Get All Records request: ${err}"`);
            }
        }
    });
};

// Preprocess the data and run Newman
(async () => {
    try {
        await preprocessData(inputFile);
        await runNewman(inputFile);
    } catch (error) {
        console.error(`"Error -> Error in main execution flow: ${error}"`);
    }
})();