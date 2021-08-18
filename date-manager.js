import DateRange from "./date-range.js"

class DateManager {

    #today

    constructor(){
        this.#today = new Date();
        this.#today.setHours(0,0,0,0);
    }
    /**
     * 
     * @param {Date} date 
     * @returns True if date is today's date, false otherwise.
     */
    isTodayDate(date) {
        if (!(date instanceof Date)) {
            throw new Error("Argument must be an instance of Date");
        }

        return this.#today.getTime() === date.getTime();
    }
    /**
     * 
     * @returns Today's date.
     */
    getTodayDate() {
        
        return this.#today;
    }

    /**
     * 
     * @param {Object} options Triplet of the form {years:y, months:m, days:d}, such that y,m,d are non-negative integers. 
     * @returns A Date in the feature.
     */
    getFutureDate(options) {
        return new Date(this.#today.getFullYear() + options.years, this.#today.getMonth() + options.months,
            this.#today.getDay() + options.days, 0, 0, 0, 0);
    }


}

let instance = new DateManager();
export default instance;