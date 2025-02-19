
async function init() {
    document.schedule = await loadSchedule("msu", "105", "1");
    
    reload();
}

function reload(selectedWeekdayIndex = -1, selectedWeekIndex = -1) {
    document.app = new App(document.schedule, selectedWeekdayIndex, selectedWeekIndex);
    document.app.displayWeekdays();
    document.app.displaySchedule();
}

function loadPreferenses() {
    // loads settings from local storage
}

function fetchSchedule(name) {
    return fetch('./' + name + '.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();  
        }).catch(error => console.error('Failed to fetch data:', error)); 
}

function loadSchedule(school, group, subgroup) {
    const jsonName = school + '_' + group + '_' + subgroup;
    return fetchSchedule(jsonName);
}

function getWeekNumber(date = new Date()) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diffInTime = date.getTime() - startOfYear.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));
    
    return Math.floor(diffInDays / 7);
}

function getMinutes(str) {
    str = str.split(":");
    return Number(str[0]) * 60 + Number(str[1]);
}



class App {
    constructor(schedule, selectedWeekdayIndex = -1, selectedWeekIndex = -1) {
        const today = new Date();
        const todayWeekdayIndex = ((today.getDay() + 6) % 7);
        
        if (selectedWeekdayIndex == -1) selectedWeekdayIndex = todayWeekdayIndex;
        if (selectedWeekIndex == -1) selectedWeekIndex = getWeekNumber(today) % schedule.cycle;

        this.schedule = schedule;
        this.todayWeekdayIndex = todayWeekdayIndex;
        this.selectedWeekdayIndex = selectedWeekdayIndex;
        this.scheduleCycle = schedule.cycle;
        this.todayWeekIndex = (getWeekNumber(today)) % schedule.cycle;
        this.selectedWeekIndex = selectedWeekIndex;
    }

    // creates html element and adds to page
    addLesson(lesson, highlighted) {
        const lessonDiv = document.createElement('div');
        lessonDiv.classList.add('lesson');

        if (highlighted) {
            lessonDiv.classList.add('selected'); 
        }

        const heading = document.createElement('h2');
        heading.textContent = lesson.name;

        const timeParagraph = document.createElement('p');
        timeParagraph.textContent = lesson.start_time + ' - ' + lesson.end_time;

        const roomParagraph = document.createElement('p');
        roomParagraph.textContent = 'каб. ' + lesson.room;

        const teacherParagraph = document.createElement('p');
        teacherParagraph.textContent = lesson.teacher;

        lessonDiv.appendChild(heading);
        lessonDiv.appendChild(timeParagraph);
        lessonDiv.appendChild(roomParagraph);
        lessonDiv.appendChild(teacherParagraph);


        const container = document.getElementById('lesson_list');
        container.appendChild(lessonDiv);
    }

    // creates html element and adds to page
    addWeekday(weekdayObj, highlighted) {
        const weekdayDiv = document.createElement('div');
        weekdayDiv.classList.add('weekday');

        if (highlighted) {
            weekdayDiv.classList.add('selected'); 
        }

        const weekday = document.createElement('h2');
        weekday.textContent = weekdayObj.name;

        const date = document.createElement('p');
        date.textContent = weekdayObj.date;

        const month = document.createElement('p');
        month.textContent = weekdayObj.month;

        weekdayDiv.appendChild(weekday);
        weekdayDiv.appendChild(date);
        weekdayDiv.appendChild(month);

        weekdayDiv.addEventListener('click', function() {
            reload(weekdayObj.weekdayIndex, weekdayObj.weekIndex);
        });

        const container = document.getElementById('weekday_list');
        container.appendChild(weekdayDiv);
    }

    addArrow(weekdayObj, arrowDirection) {
        const weekdayDiv = document.createElement('div');
        weekdayDiv.classList.add('weekday');

        const direction = document.createElement('h2');
        direction.textContent = arrowDirection > 0 ? ">" : "<";

        weekdayDiv.appendChild(direction);

        weekdayDiv.addEventListener('click', function() {
            reload(weekdayObj.weekdayIndex, (weekdayObj.weekIndex + arrowDirection) % weekdayObj.cycle);
        });

        const container = document.getElementById('weekday_list');
        container.appendChild(weekdayDiv);
    }

    displayArrow(direction){
        const reletiveWeekIndex = (this.selectedWeekIndex - this.todayWeekIndex) + (this.selectedWeekIndex - this.todayWeekIndex < 0 ? this.scheduleCycle : 0);

        if (direction > 0){
            if (reletiveWeekIndex < this.scheduleCycle - 1) {
                this.addArrow({weekdayIndex: this.selectedWeekdayIndex,
                               weekIndex: this.selectedWeekIndex,
                               cycle: this.scheduleCycle}, direction);
            }
        } else {
            if (reletiveWeekIndex > 0) {
                this.addArrow({weekdayIndex: this.selectedWeekdayIndex,
                               weekIndex: this.selectedWeekIndex,
                               cycle: this.scheduleCycle}, direction);
            }
        }
    }

    removeLessons() {
        let toRemove = document.getElementsByClassName("lesson");

        while(toRemove.length > 0) {
            toRemove[0].remove();
        }
    }

    removeWeekdays() {
        let toRemove = document.getElementsByClassName("weekday");
        
        while(toRemove.length > 0) {
            toRemove[0].remove();
        }
    }

    displaySchedule() {
        this.removeLessons();

        const selectedDaySchedule = this.schedule.schedule[this.selectedWeekIndex][
            ["mon","tue","wed","thu","fri","sat","sun"].at(this.selectedWeekdayIndex)
        ]
        
        const state = this.resolveState(selectedDaySchedule);

        
        for (let i = 0; i < selectedDaySchedule.length; i++) {
            this.addLesson(selectedDaySchedule[i], i == state.highlightedLessonIndex);
        }
        

        if (selectedDaySchedule.length == 0) state.timingText = "Занятий нет";
        document.getElementById("timing_text").innerHTML = "<strong>" + state.timingText + "<strong>";

    }

    displayWeekdays() {
        const weekdayNames = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
        const monthNames = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];

        this.removeWeekdays();

        const monday = new Date();
        monday.setDate(monday.getDate() - this.todayWeekdayIndex + 
                       7 * (this.selectedWeekIndex > this.todayWeekIndex ? 
                            (this.selectedWeekIndex - this.todayWeekIndex) : 
                            (this.todayWeekIndex - this.selectedWeekIndex)));


        this.displayArrow(-1);

        for (let i = 0; i <  7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);

            const dayAndMonth = day.toLocaleDateString("ru-RU").split('.');

            this.addWeekday({
                name: weekdayNames[i],
                date: dayAndMonth[0],
                month: monthNames[Number(dayAndMonth[1]) - 1],
                weekdayIndex: i,
                weekIndex: this.selectedWeekIndex
            }, (i == this.selectedWeekdayIndex));
        }

        this.displayArrow(1);

    }

    resolveState(daySchedule) {
        let text = "Ошибка";
        let lessonIndex = -1;
        
        const reletiveWeekIndex = (this.selectedWeekIndex - this.todayWeekIndex) + (this.selectedWeekIndex - this.todayWeekIndex < 0 ? this.scheduleCycle : 0);
        let daysTillselected = 7 * reletiveWeekIndex + this.selectedWeekdayIndex - this.todayWeekdayIndex;
        
        if (daysTillselected < 0) {
            
            text = "Уже закончились";
            
        } else if (daysTillselected > 0) {

            daysTillselected--; // через 1 день != завтра

            if (daysTillselected == 0 || daysTillselected == 1){
                text = ["Завтра","Послезавтра"].at(daysTillselected);    
                
            } else if ((daysTillselected % 100 - daysTillselected % 10) == 10) {
                text = "Через " + daysTillselected + " дней";

            } else {
                text = "Через " + daysTillselected + " " + 
                ["дней","день","дня","дня","дня","дней","дней","дней","дней","дней",].at(daysTillselected % 10);
            
            }
            
        } else {
            
            const today = new Date();
            const currentTime = 60 * today.getHours() + today.getMinutes();
            
            for (let i = 0; i < daySchedule.length; i++) {
                const startTime = getMinutes(daySchedule[i].start_time);
                const endTime = getMinutes(daySchedule[i].end_time);

                if (currentTime < endTime) {
                    if (currentTime < startTime){

                        text = "До начала " + (Math.floor((startTime - currentTime)/60) > 0 ? 
                            (Math.floor((startTime - currentTime)/60)) + " часов " : "") 
                            + ((startTime - currentTime) % 60) + " мин.";
                        lessonIndex = i;

                        break;

                    } else {

                        text = "До конца " + (endTime - currentTime) + " мин";
                        lessonIndex = i;
                        break;

                    }
                } else {
                    text = "Сегодня занятия кончились";
                }
            }

        }
        

        return {
            highlightedLessonIndex: lessonIndex,
            timingText: text
        };
    }
}