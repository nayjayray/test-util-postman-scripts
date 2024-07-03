const fs = require('fs');

// Generate a random record number
const generateRandomRecordNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `INV-${date}-${randomNumber}`;
};

// preprocess the input data file
const preprocessData = (inputFile) => {
    // read the input file
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

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

        // apply the new record number to the file and add the updatedDescription field
        jsonData[0].record_number = newRecordNumber;
        jsonData[0].updatedDescription = "cupcake";

        console.log(`Generated Record Number: ${newRecordNumber}`);
        console.log(`Updated Description: ${jsonData[0].updatedDescription}`);

        // write the preprocessed data to the output file
        fs.writeFileSync(inputFile, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error(`Error writing file: ${writeErr}`);
                return;
            }

            console.log(`Data has been preprocessed and saved to ${inputFile}`);
        });
    });
};

const inputFile = 'chain-data.json';
// const outputFile = 'chain-test.json';

preprocessData(inputFile);
