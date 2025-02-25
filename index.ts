type EventType = 'INSERTED' | 'UPDATED' | 'DELETED';

interface Event {
    eventType: EventType;
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
            eventType: splitLine[0] as EventType,
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
    console.clear();
    console.log(`Event Lookup Tool (${events.length} Events)`);
    console.log('-'.repeat(50));
    console.log(`1: Get Events by Entity Type ${selected[0] ? '(Selected)' : ''}`);
    console.log(`2: Get Events Affecting a Field ${selected[1] ? '(Selected)' : ''}`);
    console.log(`3: Get Events by Date Range ${selected[2] ? '(Selected)' : ''}\n`);
    console.log('Enter: Submit');
    console.log('c: Clear Filters');
    console.log('q: Quit');
    console.log('-'.repeat(50));
}

if (!Bun.argv[2] || !Bun.argv[2].endsWith('.csv')) {
    console.error("Events File not Provided. Please provide the path to the events file. (.csv)");
    process.exit(1);
}

const events = await readFromFile(Bun.argv[2]);

let running = true;
let filteredEvents: Event[] | undefined = undefined;
let selected = [false,false,false];


while (running) {
    displayMainMenu();
    const input = prompt('Enter your choice: ');

    if (input && selected[parseInt(input)-1]) {
        console.error('Filter Already Selected. Please Clear Filters to Select Again.');
        prompt('Press Enter to Continue');

    } else {
        console.clear();
        switch (input) {
            case 'q': {
                running = false;
                break;

            }
            case 'c': {
                filteredEvents = undefined;
                selected = [false,false,false];
                break;

            }
            case null: {
                if (!filteredEvents) {
                    console.error('No Filters Selected. Please select a filter to apply.');
                    prompt('Press Enter to Continue');

                } else if (filteredEvents.length === 0) {
                    console.error('No Events Found with Current Filters. Please try again.');
                    prompt('Press Enter to Continue');

                } else {
                    console.log(filteredEvents);
                    running = false;
                    
                }
                
                break;

            }
            case '1': {
                const type = prompt('Enter the Entity Type (INSERTED [I], UPDATED [U], DELETED [D]): ')?.toUpperCase();
                if (!type || !['I', 'U', 'D'].includes(type)) {
                    console.error('Invalid Entity Type. Please try again.');
                    prompt('Press Enter to Continue');

                } else {
                    filteredEvents = (filteredEvents ?? events).filter((event) => event.eventType[0] === type);
                    selected[0] = true;

                }
    
                break;

            }
            case '2': {
                const field = prompt('Enter the Field Name: ');
                if (!field) {
                    console.error('Please Enter a Field Name.');
                    prompt('Press Enter to Continue');

                } else {
                    filteredEvents = (filteredEvents ?? events).filter((event) => event.fieldsUpdated?.includes(field));
                    selected[1] = true;
                }
    
                break;

            }
            case '3': {
                const start = prompt('Enter the Start Date (YYYY-MM-DD HH:mm:ss.ms): ');
                const end = prompt('Enter the End Date (YYYY-MM-DD HH:mm:ss.ms): ');
                
                if (!start || !end) {
                    console.error('Please Enter Both Start Date and End Date.');
                    prompt('Press Enter to Continue');

                } else {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
        
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        console.error('Invalid Date Format. Please try again.');
                        prompt('Press Enter to Continue');

                    } else if (startDate > endDate) {
                        console.error('Start Date cannot be after End Date. Please try again.');
                        prompt('Press Enter to Continue');

                    } else {
                        filteredEvents = (filteredEvents ?? events).filter((event) => event.timestamp >= startDate && event.timestamp <= endDate);
                        selected[2] = true;

                    }
                }
    
                break;

            }
        }
    }
}

