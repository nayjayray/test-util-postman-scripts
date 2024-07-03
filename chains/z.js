const fs = require('fs');
const newman = require('newman');

const generateRandomRecordNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `INV-${date}-${randomNumber}`;
};

const preprocessData = (inputFile) => {
    const data = fs.readFileSync(inputFile, 'utf8');
    let jsonData;
    try {
        jsonData = JSON.parse(data);
    } catch (parseErr) {
        console.error(`Error parsing JSON: ${parseErr}`);
        return;
    }

    // Generate a new record number and update the file
    const newRecordNumber = generateRandomRecordNumber();
    jsonData[0].record_number = newRecordNumber;
    console.log(`Generated Record Number: ${newRecordNumber}`);

    fs.writeFileSync(inputFile, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`Data has been preprocessed and saved to ${inputFile}`);
};

function newmanRun(options) {
    return new Promise(function(onResolve){
        newman.run(options).on('done', function (err, summary) {
            if (err) {
                console.log(`\nTest run failed!\n${err}`);
                return;
            }
            console.log(`\nTest run succeeded!\n`);
            onResolve(summary);
        });
    });
}

function run1() {
    preprocessData('chain-test.json');

    let options = {
        collection: require('./collection2.json'),
        reporters: 'cli',
        iterationData: require('./chain-test.json'),
        environment: {
            values: [{ key: 'run_type', value: 'create' }]
        }
    };

    newmanRun(options).then(function(summary) {
        const responseItem = summary.run.executions.find(exec => exec.item.name === 'Create Draft Record');
        const responseBody = JSON.parse(responseItem.response.stream.toString());
        const recordId = responseBody.data.record.id;
        console.log(`Record ID: ${recordId}`);

        const inputFile = 'chain-test.json';
        const data = fs.readFileSync(inputFile, 'utf8');
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            console.error(`Error parsing JSON: ${parseErr}`);
            return;
        }

        jsonData[0].record_id = recordId;
        fs.writeFileSync(inputFile, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`Record ID has been saved to ${inputFile}`);

        run2(recordId);
    });
}

function run2(recordId) {
    let options = {
        collection: require('./collection2.json'),
        reporters: 'cli',
        iterationData: require('./chain-test.json'),
        environment: {
            values: [
                { key: 'run_type', value: 'update' },
                { key: 'record_id', value: recordId }
            ]
        }
    };

    newmanRun(options).then(function(summary) {
        console.log('Update Draft Record test run finished.');
    });
}

run1();
