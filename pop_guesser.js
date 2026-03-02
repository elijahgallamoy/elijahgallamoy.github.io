/*
Little bit more info for those interested:

- Given the total number of humans ever alive for some given date (2022 here), we can then use world population estimates to subtract from that number in order to get your index
	- Specifically, 117,020,448,575 have been born by 2022, according to the [PRB](https://www.prb.org/articles/how-many-people-have-ever-lived-on-earth/#:~:text=This%20semi%2Dscientific%20approach%20yields,about%20that%20era's%20population%20size.)
- We use [UN data](https://population.un.org/wpp/downloads?folder=Standard%20Projections&group=Population) to get per-year estimates and then interpolate between them in a given year pretty naively.
*/

async function loadServerCSV() {
    try {
        // 1. Fetch the file from the server path
        const response = await fetch('/age_data.csv');
        
        if (!response.ok) {
            throw new Error(`HTTP error; status: ${response.status}`);
        }

        // Convert the response to raw text
        const csvText = await response.text();

        // Parse the text (using a simple split or a library)
        const rows = csvText.split('\n').map(row => row.split(','));

        return rows;

    } catch (error) {
        console.error("Could not fetch the CSV:", error);
        return [];
    }
}

const humans_born_before_2022 = 117020448575+(129208*1000)+(129050*1000); // get estimate up to 2024 by adding data in

const data = (await loadServerCSV());

const births = data.splice(1).map(row => Number(row[2])*1000); // data is in thousands

async function getHumanIndex(day, month, year) {    
    // day and month are 1-indexed
    if ( year > 2024 ) { return null; }
    
    const index = births.length-(2024-year)-1; // Assuming 2022 is the first year in the births array
    const sumBirths = births.slice(index).reduce((acc, val) => acc + val, 0);

    const start_of_year_index = humans_born_before_2022 - sumBirths;

    // naively interpolate using month, day
    let day_of_year = day-1 + (365/12)*(month-1)
    let birth_range = births[index];

    return Math.trunc(start_of_year_index + birth_range*(day_of_year/365));
}

// Add listeners
document.querySelector('.pop-picker').addEventListener('update', handleDateChange)
async function handleDateChange(event) {
    const dateValue = event.target.value;
    const dateParts = dateValue.split('-');
    
    if (dateParts.length === 3) {
        const [year, month, day] = dateParts.map(Number);
        const index = await getHumanIndex(day, month, year);

        document.querySelector(".result").classList.remove('pop-hidden')

        // Trigger animation if correct year
        if (year >= 1980 && year <= 2024) {
            function setValue(num) {
                document.querySelector('#result-value').textContent = num.toLocaleString();
            }
            let i = 0;
            function update() {
                i += Math.trunc(index / 50);
                setValue(i);
                if (i < index) {
                    window.setTimeout(update, 20);
                }
                else if (i >=index) {
                    setValue(index);
                }
            }
            update();
        }
    }
}

document.querySelector('.pop-picker').addEventListener('change', handleDateChange);
