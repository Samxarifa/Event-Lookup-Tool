interface Event {
    eventType: 'INSERTED' | 'UPDATED' | 'DELETED';
    entityName: string;
    entityId: number;
    fieldsUpdated: string[] | null;
    timestamp: Date;
}

async function readFromFile(fileName: string) {
    const file = Bun.file(fileName);
    const data = await file.text().catch(() => {
        return;
    });

    if (!data) {
        console.error('Events File is Missing or Empty. Please check the file and try again.');
        process.exit(1);
    }

    const events: Event[] = [];
    data.split('\n').forEach((line) => {
        line = line.replace(/\[(.*?)\]/, (_, content) => {
            return content.replace(/, /g, ';');
        });
        const splitLine = line.split(', ');
        if (splitLine.length !== 5 || !['INSERTED', 'UPDATED', 'DELETED'].includes(splitLine[0])) {
            console.error('Events File is in an Invalid Format. Please check the file and try again.');
            process.exit(1);
        }

        const event: Event = {
            eventType: splitLine[0] as 'INSERTED' | 'UPDATED' | 'DELETED',
            entityName: splitLine[1],
            entityId: parseInt(splitLine[2]),
            fieldsUpdated: splitLine[3] === 'null' ? null : splitLine[3].split(';'),
            timestamp: new Date(splitLine[4])
        };
        events.push(event);
    });
    
    return events;
}


const events = await readFromFile('events.csv');

let running = true;
while (running) {
    console.log(`Event Lookup Tool (${events.length} Events)`);
    console.log('-'.repeat(50));
    console.log('1. Get Events by Entity Name');
    console.log('2. Get Events Affecting a Field');
    console.log('3. Get Events by Date Range');
    console.log('Enter. Submit');
    console.log('q. Quit');
    console.log('-'.repeat(50));
    process.stdout.write('Enter your choice: ');
    for await (const line of console) {
        console.log(line);
    }
}

