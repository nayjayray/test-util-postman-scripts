const newman = require('newman'); // require newman in project
const fs = require('fs');
const axios = require('axios'); // for making HTTP requests

// Define your Postman API URLs
const collectionUrl = 'https://api.getpostman.com/collections/13782757-72af7e18-33ca-4e2c-8dde-a0028bcdf75e?apikey=PMAK-6675382321559a000115c262-b82e39ff92ba2c0ca13382928ec6757e4d';
const environmentUrl = 'https://api.getpostman.com/environments/13782757-c2ad22d4-2ec5-4121-be7e-223aca294d79?apikey=PMAK-6675382321559a000115c262-b82e39ff92ba2c0ca13382928ec6757e4d';
const folderName = 'Chain tests';
const dataFilePath = 'chain-data.json';

// Function to fetch data from Postman API
async function fetchPostmanData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data from Postman API:', error);
        throw error;
    }
}

// Call the async function to fetch collection and environment data
async function runNewman() {
    try {
        // Fetch collection and environment data
        const collectionData = await fetchPostmanData(collectionUrl);
        const environmentData = await fetchPostmanData(environmentUrl);

        // Configure Newman run options
        const newmanOptions = {
            collection: collectionData,
            environment: environmentData,
            reporters: 'cli',
            folder: folderName,
            iterationData: dataFilePath // Specify your data file here
        };

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
                }
            });

            console.log('Request name: ' + data.item.name);
            console.log(data.response.stream.toString());
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function to start Newman run
runNewman();
