const newman = require('newman'); // require newman in project
const fs = require('fs');
const axios = require('axios'); // for making HTTP requests

// Define your Postman API URLs
const collectionUrl = 'https://api.getpostman.com/collections/13782757-75f887b6-c188-433d-9323-b6597e840757?apikey=PMAK-6675382321559a000115c262-b82e39ff92ba2c0ca13382928ec6757e4d';
const environmentUrl = 'https://api.getpostman.com/environments/13782757-c2ad22d4-2ec5-4121-be7e-223aca294d79?apikey=PMAK-6675382321559a000115c262-b82e39ff92ba2c0ca13382928ec6757e4d';
const folderName = 'Chain tests';

// Function to fetch data from Postman API
async function fetchPostmanData(url) {
    try {
        console.log('Fetching data from:', url);
        const response = await axios.get(url);
        console.log('Data fetched successfully.');
        return response.data;
    } catch (error) {
        console.error('Error fetching data from Postman API:', error);
        throw error;
    }
}

// Call the async function to fetch collection and environment data
async function runNewman() {
    try {
        console.log('Fetching collection and environment data...');
        // Fetch collection and environment data
        const collectionData = await fetchPostmanData(collectionUrl);
        const environmentData = await fetchPostmanData(environmentUrl);

        // Configure Newman run options
        const newmanOptions = {
            collection: collectionData,
            environment: environmentData,
            reporters: 'cli',
            folder: folderName,
            // iterationData: dataFilePath // Specify your data file here
        };

        console.log('Starting Newman run...');
        // Run Newman and handle the request event
        newman.run(newmanOptions).on('request', (error, data) => {
            if (error) {
                console.error('Error running Newman:', error);
                return;
            }

            // Example code to handle the response
            const requestName = data.item.name.replace(/[^a-z0-9]/gi, '-');
            const randomString = Math.random().toString(36).substring(7);
            const fileName = `response-${requestName}-${randomString}.json`;
            const content = data.response.stream.toString();

            fs.writeFile(fileName, content, function (error) {
                if (error) {
                    console.error('Error writing file:', error);
                } else {
                    console.log('File written successfully:', fileName);
                }
            });

            console.log('Request name:', data.item.name);
            console.log('Response:', data.response.stream.toString());
        }).on('done', (error, summary) => {
            if (error || summary.error) {
                console.error('Collection run encountered an error:', error || summary.error);
            } else {
                console.log('Collection run completed successfully.');
                console.log('Total requests:', summary.run.stats.requests.total);
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function to start Newman run
runNewman();
