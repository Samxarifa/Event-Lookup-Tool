/**
 * Event Lookup Tool
 * Author: Sam Hay
 * Date: 2025-02-25
*/

// Strict Type for Event Type
type EventType = 'INSERTED' | 'UPDATED' | 'DELETED';

// Interface for Event Object
interface Event {
    eventType: EventType;
    entityName: string;
    entityId: number;
    fieldsUpdated: string[] | null;
    timestamp: Date;
}

/**
 * Reads the contents of a file and returns the data as an array of Event objects.
 * @param {string} fileName - The location of the file to read.
 * @returns {Promise<Event[]>} An array of Event objects.
 */
async function readFromFile(fileName: string): Promise<Event[]> {
    // Reads in file as a string
    const file = Bun.file(fileName);
    const data = await file.text().catch(() => {
        return;
    });

    // Handles empty or missing file
    if (!data) {
        console.error('Events File is Missing or Empty. Please check the file and try again.');
        process.exit(1);
    }

    // Parses data into an array of Event objects
    const events: Event[] = [];
    data.split('\n').forEach((line) => {
        // Replaces commas in fieldsUpdated Array with semicolons to prevent splitting (using regex)
        line = line.replace(/\[(.*?)\]/, (_, content) => {
            return content.replace(/, /g, ';');
        });
        // Splits line into array of values
        const splitLine = line.split(', ');
        // Checks if line has correct number of values
        if (splitLine.length !== 5) {
            console.error('Events File is in an Invalid Format. Please check the file and try again.');
            process.exit(1);
        }

        // Creates Event object and pushes to events array
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

/**
 * Displays the main menu of the program.
 */
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

/**
 * Gets File Location from Command Line Arguments
 * @returns {string} The Location of the File.
 */
function getFileName(): string {
    // Checks if file name is provided and is a .csv file
    if (!Bun.argv[2] || !Bun.argv[2].endsWith('.csv')) {
        console.error("Events File not Provided. Please provide the path to the events file. (.csv)");
        process.exit(1);
    } else {
        return Bun.argv[2];
    }
}

/*---- Main Program ----*/

// Reads in events from file
const events = await readFromFile(getFileName());

// Declares variables for main loop
let running = true;
let filteredEvents: Event[] | undefined = undefined;
let selected = [false,false,false];

// Main Program Loop
while (running) {
    displayMainMenu();
    // Gets user input
    const input = prompt('Enter your choice: ');

    // Checks if filter option has already been selected
    if (input && selected[parseInt(input)-1]) {
        console.error('Filter Already Selected. Please Clear Filters to Select Again.');
        prompt('Press Enter to Continue');
    } else {
        console.clear();
        // Switch statement for user input
        switch (input) {
            // Quit
            case 'q': {
                running = false;
                break;

            }
            // Clear Filters
            case 'c': {
                filteredEvents = undefined;
                selected = [false,false,false];
                break;

            }
            // Submit
            case null: {
                // Checks if filters have been selected
                if (!filteredEvents) {
                    console.error('No Filters Selected. Please select a filter to apply.');
                    prompt('Press Enter to Continue');

                } 
                // Checks if no events are found with current filters
                else if (filteredEvents.length === 0) {
                    console.error('No Events Found with Current Filters. Please try again.');
                    prompt('Press Enter to Continue');


                } 
                // Ends program and displays events filtered
                else {
                    running = false;
                    // Displays filtered events in table
                    console.table(filteredEvents.map((event) => {
                        return {
                            'Event Type': event.eventType,
                            'Entity Name': event.entityName,
                            'Entity ID': event.entityId,
                            'Fields Updated': event.fieldsUpdated?.join(', ') ?? 'N/A',
                            'Timestamp': `${event.timestamp.toLocaleDateString()} ${event.timestamp.toLocaleTimeString()}`
                        };
                    }));
                }
                
                break;

            }
            // Filter by Entity Type
            case '1': {
                // Gets Entity Type from user and capitalizes
                const type = prompt('Enter the Entity Type (INSERTED [I], UPDATED [U], DELETED [D]): ')?.toUpperCase();
                // Checks if input is valid
                if (!type || !['I', 'U', 'D'].includes(type)) {
                    console.error('Invalid Entity Type. Please try again.');
                    prompt('Press Enter to Continue');

                } 
                // Filters events by Entity Type and sets selected to true
                else {
                    // Either filters events array or adds another filter to filteredEvents array
                    filteredEvents = (filteredEvents ?? events).filter((event) => event.eventType[0] === type);
                    selected[0] = true;

                }
    
                break;

            }
            // Filter by Field Updated
            case '2': {
                // Gets Field Name from user
                const field = prompt('Enter the Field Name: ');
                // Checks if input return exists
                if (!field) {
                    console.error('Please Enter a Field Name.');
                    prompt('Press Enter to Continue');

                } 
                // Filters events by Field Name and sets selected to true
                else {
                    filteredEvents = (filteredEvents ?? events).filter((event) => event.fieldsUpdated?.includes(field));
                    selected[1] = true;
                }
    
                break;

            }
            // Filter by Date Range (Inclusive)
            case '3': {
                // Gets Start and End Date from user
                const start = prompt('Enter the Start Date (YYYY-MM-DD HH:mm:ss.ms): ');
                const end = prompt('Enter the End Date (YYYY-MM-DD HH:mm:ss.ms): ');
                
                // Checks if inputs returned exist
                if (!start || !end) {
                    console.error('Please Enter Both Start Date and End Date.');
                    prompt('Press Enter to Continue');

                } else {
                    // Parses Dates and checks if valid
                    const startDate = new Date(start);
                    const endDate = new Date(end);
        
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        console.error('Invalid Date Format. Please try again.');
                        prompt('Press Enter to Continue');

                    } 
                    // Makes sure End Date is after Start Date
                    else if (startDate > endDate) {
                        console.error('Start Date cannot be after End Date. Please try again.');
                        prompt('Press Enter to Continue');

                    } 
                    // Filters events by Date Range and sets selected to true
                    else {
                        filteredEvents = (filteredEvents ?? events).filter((event) => event.timestamp >= startDate && event.timestamp <= endDate);
                        selected[2] = true;

                    }
                }
    
                break;

            }
            // Invalid Input
            default: {
                console.error('Invalid Input. Please try again.');
                prompt('Press Enter to Continue');
            }
        }
    }
}

