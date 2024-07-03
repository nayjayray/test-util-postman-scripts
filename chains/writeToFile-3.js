const newman = require('newman');
const fs = require('fs').promises;

// Generate a random record number
const generateRandomRecordNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `INV-${date}-${randomNumber}`;
};

// Function to preprocess data asynchronously
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

        console.log(`Generated Record Number: ${newRecordNumber}`);

        // Write the preprocessed data to the output file
        await fs.writeFile(inputFile, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`Data has been preprocessed and saved to ${inputFile}`);

    } catch (error) {
        console.error(`Error in preprocessing data: ${error}`);
    }
};

// Function to run Newman with async/await
const runNewman = async (inputFile) => {
    try {
        // Run Newman asynchronously
        const run = await newman.run({
            collection: require('./collection2.json'), // path to the Postman collection
            reporters: 'cli',
            iterationData: require(`./${inputFile}`), // path to the data file
        });

        // Handle Newman events
        run.on('beforeRequest', async (error, data) => {
            if (error) {
                console.log(error);
                return;
            }

            // Process the 'Create Draft Record' request
            if (data.item.name === 'Create Draft Record') {
                // Print the request body for debugging
                const requestBody = data.request.body.raw;
                console.log(`Request Body for Create Draft Record: ${requestBody}`);
            }

            // Process the 'Update Draft Record' request
            if (data.item.name === 'Update Draft Record') {
                try {
                    // Read the existing data file synchronously
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
        });

        run.on('request', async (error, data) => {
            if (error) {
                console.error(error);
                return;
            }

            // Print the response for debugging
            const responseBody = data.response.stream.toString();
            console.log(`Response Body for ${data.item.name}: ${responseBody}`);

            // Handle logic after 'Create Draft Record' request
            if (data.item.name === 'Create Draft Record') {
                try {
                    // Check if 'Create Draft Record' was successful (200 status)
                    const responseJson = JSON.parse(responseBody);
                    if (responseJson.success) {
                        // Continue with 'Update Draft Record' logic if successful
                        console.log('Create Draft Record successful. Proceeding with Update Draft Record.');
                    } else {
                        console.error('Create Draft Record failed. Cannot proceed with Update Draft Record.');
                    }
                } catch (error) {
                    console.error(`Error processing Create Draft Record response: ${error}`);
                }
            }
        });
    } catch (error) {
        console.error(`Error running Newman: ${error}`);
    }
};

const inputFile = 'chain-test.json';

// Execute preprocessing and Newman run sequentially
(async () => {
    await preprocessData(inputFile); // Preprocess data first
    await runNewman(inputFile); // Run Newman after data preprocessing
})();
