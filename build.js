// build.js
const fs = require('fs');
const path = require('path');
const talksData = require('./talksData');

const generateSchedule = (talks) => {
    const startTime = new Date();
    startTime.setHours(10, 0, 0, 0); // Event starts at 10:00 AM

    let currentTime = new Date(startTime);
    const schedule = [];

    const addEvent = (type, details) => {
        schedule.push({
            type,
            startTime: new Date(currentTime),
            endTime: null, // Will be set after duration
            details
        });
    };

    const addDuration = (durationMinutes) => {
        currentTime.setMinutes(currentTime.getMinutes() + durationMinutes);
        schedule[schedule.length - 1].endTime = new Date(currentTime);
    };

    const addTransition = () => {
        const lastEvent = schedule[schedule.length - 1];
        if (lastEvent && lastEvent.type !== 'Break' && lastEvent.type !== 'Lunch') {
             // Only add transition if the previous event was a talk
            const transitionStartTime = new Date(currentTime);
            currentTime.setMinutes(currentTime.getMinutes() + 10);
            schedule.push({
                type: "Transition",
                startTime: transitionStartTime,
                endTime: new Date(currentTime),
                details: "10-minute break"
            });
        }
    };

    for (let i = 0; i < talks.length; i++) {
        // Check for lunch break after the third talk (assuming 6 talks total)
        if (i === 3) {
            addTransition(); // Transition before lunch
            addEvent("Lunch", { title: "Lunch Break", duration: 60 });
            addDuration(60);
            addTransition(); // Transition after lunch
        }

        addEvent("Talk", talks[i]);
        addDuration(talks[i].duration);
        if (i < talks.length -1 && i !== 2) { // No transition after the last talk, and no transition before lunch (already added)
            addTransition();
        }
    }

    return schedule;
};

const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const talksSchedule = generateSchedule(talksData);

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Technical Talks Event</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            text-align: center;
            color: #0056b3;
        }
        .search-bar {
            margin-bottom: 20px;
            text-align: center;
        }
        .search-bar input {
            width: 70%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        .schedule-item {
            background-color: #e9ecef;
            border: 1px solid #dee2e6;
            margin-bottom: 10px;
            padding: 15px;
            border-radius: 5px;
        }
        .schedule-item.talk {
            background-color: #f8f9fa;
        }
        .schedule-item.lunch {
            background-color: #ffeeba;
            border-color: #ffc107;
            text-align: center;
            font-weight: bold;
        }
        .schedule-item.transition {
            background-color: #d1ecf1;
            border-color: #bee5eb;
            text-align: center;
            font-style: italic;
            font-size: 0.9em;
        }
        .talk-title {
            font-size: 1.2em;
            color: #0056b3;
            margin-bottom: 5px;
        }
        .talk-speakers {
            font-size: 0.9em;
            color: #6c757d;
            margin-bottom: 5px;
        }
        .talk-category {
            font-size: 0.8em;
            color: #28a745;
            margin-bottom: 10px;
        }
        .talk-description {
            font-size: 0.9em;
            line-height: 1.5;
        }
        .time {
            font-weight: bold;
            color: #495057;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Technical Talks Schedule</h1>
        <div class="search-bar">
            <input type="text" id="categorySearch" placeholder="Search by category (e.g., AI, Frontend)">
        </div>
        <div id="schedule">
            <!-- Schedule items will be rendered here by JavaScript -->
        </div>
    </div>

    <script>
        const allTalksSchedule = ${JSON.stringify(talksSchedule, null, 2)};

        function renderSchedule(scheduleToRender) {
            const scheduleDiv = document.getElementById('schedule');
            scheduleDiv.innerHTML = ''; // Clear previous schedule

            scheduleToRender.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('schedule-item', item.type.toLowerCase());

                const timeSpan = document.createElement('span');
                timeSpan.classList.add('time');
                const startTime = new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                timeSpan.textContent = startTime + " - " + endTime;
                itemDiv.appendChild(timeSpan);

                if (item.type === 'Talk') {
                    const talkTitle = document.createElement('h3');
                    talkTitle.classList.add('talk-title');
                    talkTitle.textContent = item.details.title;
                    itemDiv.appendChild(talkTitle);

                    const speakers = document.createElement('p');
                    speakers.classList.add('talk-speakers');
                    speakers.textContent = "Speakers: " + item.details.speakers.join(', ');
                    itemDiv.appendChild(speakers);

                    const category = document.createElement('p');
                    category.classList.add('talk-category');
                    category.textContent = "Categories: " + item.details.category.join(', ');
                    itemDiv.appendChild(category);

                    const description = document.createElement('p');
                    description.classList.add('talk-description');
                    description.textContent = item.details.description;
                    itemDiv.appendChild(description);
                } else if (item.type === 'Lunch') {
                    const lunchTitle = document.createElement('h3');
                    lunchTitle.textContent = item.details.title;
                    itemDiv.appendChild(lunchTitle);
                } else if (item.type === 'Transition') {
                    const transitionText = document.createElement('p');
                    transitionText.textContent = item.details;
                    itemDiv.appendChild(transitionText);
                }
                scheduleDiv.appendChild(itemDiv);
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            renderSchedule(allTalksSchedule);

            const searchInput = document.getElementById('categorySearch');
            searchInput.addEventListener('input', (event) => {
                const searchTerm = event.target.value.toLowerCase().trim();
                if (searchTerm === '') {
                    renderSchedule(allTalksSchedule); // Show all if search is empty
                    return;
                }

                const filteredSchedule = allTalksSchedule.filter(item => {
                    if (item.type === 'Talk') {
                        return item.details.category.some(cat => cat.toLowerCase().includes(searchTerm));
                    }
                    return false; // Don't filter non-talk items by category
                });

                renderSchedule(filteredSchedule);
            });
        });
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'index.html'), htmlTemplate.trim());
console.log('index.html generated successfully!');
