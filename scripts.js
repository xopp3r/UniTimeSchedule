

async function init() {    

    if (document.schedule === undefined) {
        document.schedule = await fetchSchedule();
        setInterval(init, 60000); // update every minute to keep text accurate
    }

    if (document.selectedWeekday === undefined) {
        const today = new Date();
        document.selectedWeekday = (today.getDay() + 6) % 7;
        if (document.selectedWeekday == 6) document.selectedWeekday = 0 // switch to monday if today is sunday
    } else {
        removeExisting();
    }

    displaySchedule(document.schedule, document.selectedWeekday);
    displayWeekdays(document.selectedWeekday)
}



function fetchSchedule() {
    return fetch('./schedule.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();  
        })
        .then(data => {
            return data
        })  
        .catch(error => console.error('Failed to fetch data:', error)); 
}



function addLesson(lesson, highlighted) {
    const weekdayDiv = document.createElement('div');
    weekdayDiv.classList.add('lesson');

    if (highlighted) {
        weekdayDiv.classList.add('selected');
    }

    const heading = document.createElement('h2');
    heading.textContent = lesson.name;

    const timeParagraph = document.createElement('p');
    timeParagraph.textContent = lesson.start_time + ' - ' + lesson.end_time;

    const roomParagraph = document.createElement('p');
    roomParagraph.textContent = 'каб. ' + lesson.room;

    const teacherParagraph = document.createElement('p');
    teacherParagraph.textContent = lesson.teacher;

    weekdayDiv.appendChild(heading);
    weekdayDiv.appendChild(timeParagraph);
    weekdayDiv.appendChild(roomParagraph);
    weekdayDiv.appendChild(teacherParagraph);


    const container = document.getElementById('lesson_list');
    container.appendChild(weekdayDiv);
}



function addWeekdays(weekdayName, dateStr, highlighted, number) {
    const weekdayDiv = document.createElement('div');
    weekdayDiv.classList.add('weekday');

    if (highlighted) {
        weekdayDiv.classList.add('selected'); 
    }

    const weekday = document.createElement('h2');
    weekday.textContent = weekdayName;

    const date = document.createElement('p');
    date.textContent = dateStr;

    weekdayDiv.appendChild(weekday);
    weekdayDiv.appendChild(date);

    weekdayDiv.addEventListener('click', function() {
        document.selectedWeekday = number;
        init();
    });

    const container = document.getElementById('weekday_list');
    container.appendChild(weekdayDiv);
}



function displayWeekdays(selectedWeekday) {
    const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
    const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

    const today = new Date();
    const todayWeekday = (today.getDay() + 6) % 7;

    let monday = new Date(today);
    monday.setDate(today.getDate() - todayWeekday);

    for (let i = 0; i < 6; i++) { // set to 7 for sunday
        const day = new Date(monday);
        day.setDate(monday.getDate() + ( i >= todayWeekday   ? i : i + 7 ));

        dayAndMonth = day.toLocaleDateString("ru-RU").split('.')

        addWeekdays(weekdays[(day.getDay() + 6) % 7], 
                    dayAndMonth[0] + ' ' + months[Number(dayAndMonth[1]) - 1],
                    document.selectedWeekday == i,
                    i );

    }
}


function getMinutes(str) {
    str = str.split(":");
    return Number(str[0]) * 60 + Number(str[1]);
}


function displaySchedule(schedule, weekdayIndex) { // не пиздеть, весь сайт сделан за один день
    const weekdays = ["mon","tue","wed","thu","fri","sat","sun"];
    const daysForms = ["день", "дня", "дня", "дня", "дней", "дней", "дней"];
    const currentDate = new Date();
    let upperText = "Ошибка";
    let currentTime = 60 * currentDate.getHours() + currentDate.getMinutes();
    const today = weekdayIndex == ((currentDate.getDay() + 6) % 7);
    
    let daySchedule = schedule["schedule"][weekdays[weekdayIndex]];
    
    if (today){
        if (daySchedule.length > 0) {
            upperText = "Занятия закончились"
        } else {    
            upperText = "В этот день нет занятий";
        }

        for (let i = 0; i < daySchedule.length; i++) {

            let lessonIncomingOrStarted = (i > 0 ? getMinutes(daySchedule[i-1]["end_time"]) : 1) <= currentTime && getMinutes(daySchedule[i]["end_time"]) >= currentTime;
        
            if (lessonIncomingOrStarted) {
                if (getMinutes(daySchedule[i]["start_time"]) <= currentTime){
                    upperText = "Закончится через " + String(getMinutes(daySchedule[i]["end_time"]) - currentTime) + " мин";
                } else {
                    let minutes = getMinutes(daySchedule[i]["start_time"]) - currentTime;
                    upperText = "Следующее занятие через " + (Math.floor(minutes/60) ? String(Math.floor(minutes/60)) + " часов ": "") + minutes%60 + " мин";
                }
                addLesson(daySchedule[i], true);
            } else {
                addLesson(daySchedule[i], false);

            }
    
        }

    } else {

        for (let i = 0; i < daySchedule.length; i++) {
                addLesson(daySchedule[i], false);
        }

        let daysLeft = (weekdayIndex - ((currentDate.getDay() + 6) % 7)) % 7;
        if (daysLeft < 0) daysLeft += 7;
        upperText = "Через " + String(daysLeft) + " " + daysForms[daysLeft - 1];
    }


    document.getElementById("timing_text").innerHTML = "<strong>" + upperText + "</strong>";

}



function removeExisting() {
    let toRemove = document.getElementsByClassName("lesson");

    while(toRemove.length > 0) {
        toRemove[0].remove();
    }

    toRemove = document.getElementsByClassName("weekday");
    
    while(toRemove.length > 0) {
        toRemove[0].remove();
    }
}
