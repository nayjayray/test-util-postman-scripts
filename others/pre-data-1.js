const fs = require('fs');

// generate a random record number
const generateRandomRecordNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `INV-${date}-${randomNumber}`;
};

// preprocess the input data file
const preprocessData = (inputFile, outputFile) => {
    // Read the input file
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }

        // parse the input json data
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            console.error(`Error parsing JSON: ${parseErr}`);
            return;
        }

        const recordNumbers = new Set();

        // process each scenario
        jsonData.forEach((scenario, index) => {
            let newRecordNumber;
            // ensure unique record numbers
            do {
                newRecordNumber = generateRandomRecordNumber();
            } while (recordNumbers.has(newRecordNumber));
            
            recordNumbers.add(newRecordNumber);
            scenario.record_number = newRecordNumber;

            console.log(`Scenario ${index + 1} - Generated Record Number: ${newRecordNumber}`);
        });

        // write the preprocessed data to the output file
        fs.writeFile(outputFile, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error(`Error writing file: ${writeErr}`);
                return;
            }

            console.log(`Data has been preprocessed and saved to ${outputFile}`);
        });
    });
};

const inputFile = 'P-record.json';
const outputFile = 'preprocessed_data.json';

preprocessData(inputFile, outputFile);
