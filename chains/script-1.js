const newman = require('newman'); 
const fs = require('fs');

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

const inputFile = 'data.json';

// step 1: preprocess the data
// preprocessData(inputFile);

// step 2: run newman
const runNewman = (inputFile) => {
newman.run({
    collection: require('./collection2.json'), // path to the Postman collection
    reporters: 'cli',
    iterationData: require('./data.json'), // path to the data file
}).on('beforeRequest', (error, data) => {
    if (error) {
        console.log(error);
        return;
    }

    if (data.item.name === 'Update Draft Record') {
        // read the existing data file synchronously
        const fileData = fs.readFileSync(inputFile, 'utf8');

        // parse JSON data
        let jsonData;
        try {
            jsonData = JSON.parse(fileData);
        } catch (parseErr) {
            console.error(`Error parsing JSON: ${parseErr}`);
            return;
        }

        // get the record ID from the file
        const recordId = jsonData[0].record_id;

        // print the recordId for debugging
        console.log(`Record ID for Update Draft Record: ${recordId}`);

        // replace the recordId in the request URL
        const updatedUrl = data.request.url.toString().replace(':recordId', recordId);
        data.request.url = updatedUrl;

        // print the updated URL for debugging
        console.log(`Updated URL for Update Draft Record: ${updatedUrl}`);
    }
}).on('request', (error, data) => {
    if (error) {
        console.log(error);
        return;
    }

    const requestName = data.item.name.replace(/[^a-z0-9]/gi, '-');
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `response-${requestName}-${randomString}.txt`;
    const content = data.response.stream.toString();
    
    fs.writeFile(fileName, content, function (error) {
        if (error) { 
             console.error(error); 
        }
     });

    // extract and save the record_id from the Create Draft Record response
    if (data.item.name === 'Create Draft Record') {
        const responseBody = JSON.parse(content);
        const recordId = responseBody.data.record.id;

        // read the existing data file
        fs.readFile(inputFile, 'utf8', (err, fileData) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                return;
            }

            // parse JSON data
            let jsonData;
            try {
                jsonData = JSON.parse(fileData);
            } catch (parseErr) {
                console.error(`Error parsing JSON: ${parseErr}`);
                return;
            }

            // update the record_id in the file
            jsonData[0].record_id = recordId;

            // write the updated data back to the file
            fs.writeFileSync(inputFile, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error(`Error writing file: ${writeErr}`);
                    return;
                }

                console.log(`Record ID has been saved to ${inputFile}`);
            });
        });
    }
}).on('beforeRequest', (error, data) => {
    if (error) {
        console.log(error);
        return;
    }

    if (data.item.name === 'Update Draft Record') {
        // print the request body for debugging
        const requestBody = data.request.body.raw;
        console.log(`Request Body for Update Draft Record: ${requestBody}`);
    }
}).on('request', (error, data) => {
    if (error) {
        console.log(error);
        return;
    }

    // print the response for debugging
    const responseBody = data.response.stream.toString();
    console.log(`Response Body for ${data.item.name}: ${responseBody}`);
    
});

};


// Preprocess the data and run Newman
(async () => {
    await preprocessData(inputFile);
    runNewman(inputFile);
})();
