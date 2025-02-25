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

function displayMainMenu() {
    console.log('-'.repeat(50));
    console.log(`1. Get Events by Entity Type ${selected[0] ? '(Selected)' : ''}`);
    console.log(`2. Get Events Affecting a Field ${selected[1] ? '(Selected)' : ''}`);
    console.log(`3. Get Events by Date Range ${selected[2] ? '(Selected)' : ''}`);
    console.log('Enter. Submit');
    console.log('q. Quit');
    console.log('-'.repeat(50));
}

const events = await readFromFile('events.csv');

let running = true;
let filteredEvents: Event[] | undefined = undefined;
let selected = [false,false,false];

console.clear();
console.log(`Event Lookup Tool (${events.length} Events)`);

while (running) {
    displayMainMenu();
    const input = prompt('Enter your choice: ');

    switch (input) {
        case 'q': {
            running = false;
            break;
        }
        case null: {
            console.log(filteredEvents || events);
            running = false;
            break;
        }
        case '1': {
            console.clear();
            const type = prompt('Enter the Entity Type: ');
            if (type === null) {
                break;
            }

            if (filteredEvents) {
                filteredEvents = filteredEvents.filter((event) => event.eventType === type);
            }
            else {
                filteredEvents = events.filter((event) => event.eventType === type);
            }
            selected[0] = true;
            break;
        }
        case '2': {
            console.clear();
            const field = prompt('Enter the Field Name: ');
            if (field === null) {
                break;
            }

            if (filteredEvents) {
                filteredEvents = filteredEvents.filter((event) => event.fieldsUpdated?.includes(field));
            }
            else {
                filteredEvents = events.filter((event) => event.fieldsUpdated?.includes(field));
            }
            selected[1] = true;
            break;
        }
        case '3': {
            console.clear();
            const start = prompt('Enter the Start Date (YYYY-MM-DD HH:mm:ss:ms): ');
            const end = prompt('Enter the End Date (YYYY-MM-DD HH:mm:ss:ms): ');
            if (start === null || end === null) {
                break;
            }

            const startDate = new Date(start);
            const endDate = new Date(end);
            
            if (filteredEvents) {
                filteredEvents = filteredEvents.filter((event) => event.timestamp >= startDate && event.timestamp <= endDate);
            }
            else {
                filteredEvents = events.filter((event) => event.timestamp >= startDate && event.timestamp <= endDate);
            }
            selected[2] = true;
            break;
        }
    }
}

