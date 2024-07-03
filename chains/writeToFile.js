const newman = require('newman'); // require newman in project
const fs = require('fs');

// generate a random record number
const generateRandomRecordNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `INV-${date}-${randomNumber}`;
};

// preprocess the input data file
const preprocessData = (inputFile) => {
    // read the input file
    const data = fs.readFileSync(inputFile, 'utf8');

    // parse the input JSON data
    let jsonData;
    try {
        jsonData = JSON.parse(data);
    } catch (parseErr) {
        console.error(`Error parsing JSON: ${parseErr}`);
        return;
    }

    // generate a unique record number
    const newRecordNumber = generateRandomRecordNumber();

    // apply the new record number to the file
    jsonData[0].record_number = newRecordNumber;

    console.log(`Generated Record Number: ${newRecordNumber}`);

    // write the preprocessed data to the output file
    fs.writeFileSync(inputFile, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`Data has been preprocessed and saved to ${inputFile}`);
};

const inputFile = 'chain-test.json';

// preprocess the data
preprocessData(inputFile);

// run Newman
newman.run({
    collection: require('./create.json'), // path to the Postman collection
    reporters: 'cli',
    iterationData: require('./chain-test.json'), // path to the data file
}).on('beforeRequest', (error, data) => {
    if (error) {
        console.log(error);
        return;
    }

    if (data.request.body) {
        const requestName = data.item.name.replace(/[^a-z0-9]/gi, '-');
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `request-${requestName}-${randomString}.txt`;
        const content = data.request.body.raw;
        
        fs.writeFile(fileName, content, function (error) {
            if (error) { 
                 console.error(error); 
            }
         });        
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

    console.log(`Response Body for ${data.item.name}: ${content}`);

    // extract and save the record_id from the Create Draft Record response
    if (data.item.name === 'Create Draft Record') {
        const responseBody = JSON.parse(content);
        const recordId = responseBody.data.record.id;

        // read the existing data file
        const data = fs.readFileSync(inputFile, 'utf8');

        // parse JSON data
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            console.error(`Error parsing JSON: ${parseErr}`);
            return;
        }

        // update the record_id in the file
        jsonData[0].record_id = recordId;

        // write the updated data back to the file
        fs.writeFileSync(inputFile, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`Record ID has been saved to ${inputFile}`);
    }
});
