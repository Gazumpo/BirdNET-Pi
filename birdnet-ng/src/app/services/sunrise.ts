import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Sunrise {
  //private apiUrl = '/json';
  private apiUrl = 'https://api.sunrise-sunset.org/json'

  constructor(
    private http: HttpClient) {
  }

  getSunrise(date: string): Observable<any> {
    let params = new HttpParams()
      .set('lat', '-31.9832')
      .set('lng', '115.7762')
      .set('tzid', 'Australia/Perth')
      .set('date', date);
    return this.http.get(this.apiUrl, { params }).pipe(
      map((response: any) => {
        if (response) {
          response.results.astronomical_twilight_begin = this.convertTime12hTo24h(response.results.astronomical_twilight_begin)
          response.results.astronomical_twilight_end = this.convertTime12hTo24h(response.results.astronomical_twilight_end)
          response.results.civil_twilight_begin = this.convertTime12hTo24h(response.results.civil_twilight_begin)
          response.results.civil_twilight_end = this.convertTime12hTo24h(response.results.civil_twilight_end)
          response.results.nautical_twilight_begin = this.convertTime12hTo24h(response.results.nautical_twilight_begin)
          response.results.nautical_twilight_end = this.convertTime12hTo24h(response.results.nautical_twilight_end)
          response.results.solar_noon = this.convertTime12hTo24h(response.results.solar_noon)
          response.results.sunrise = this.convertTime12hTo24h(response.results.sunrise)
          response.results.sunset = this.convertTime12hTo24h(response.results.sunset)
        }
        return response
      })
    )
  }

  convertTime12hTo24h(time12h: string): string {
    // Check if the input string is valid
    if (!time12h || typeof time12h !== 'string' || !time12h.includes(' ')) {
      throw new Error('Invalid time format. Please use "H:MM:SS AM/PM".');
    }

    // Split the time string and the AM/PM part
    const [time, period] = time12h.split(' ');
    const [hoursStr, minutesStr, secondsStr] = time.split(':');

    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);

    // Handle AM/PM conversion
    if (period.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0; // Midnight (12 AM) is 00 in 24-hour format
    }

    // Format hours, minutes, and seconds to be two digits
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  

  parseTime(timeString: string) {
    const parts = timeString.split(':').map(Number);
    return parts[0] * 10000 + parts[1] * 100 + parts[2];
  }

/**
 * Determines the time of day (e.g., "Civil Twilight", "Daytime", "Night")
 * based on a provided set of astronomical and solar times.
 *
 * @param {object} times An object containing the astronomical and solar times.
 * @param {string} currentTime The current time to check, in "HH:MM:SS" format.
 * @returns {string} The name of the time period the current time falls into.
 */
returnTimeType(sunrise_response: any, time: string): string {
  // Parse all time strings into numeric values for easy comparison.
  const current = this.parseTime(time);

  const astroBegin = this.parseTime(sunrise_response.astronomical_twilight_begin);
  const nauticalBegin = this.parseTime(sunrise_response.nautical_twilight_begin);
  const civilBegin = this.parseTime(sunrise_response.civil_twilight_begin);
  const sunrise = this.parseTime(sunrise_response.sunrise);
  const midday = this.parseTime("12:00:00")
  const sunset = this.parseTime(sunrise_response.sunset);
  const civilEnd = this.parseTime(sunrise_response.civil_twilight_end);
  const nauticalEnd = this.parseTime(sunrise_response.nautical_twilight_end);
  const astroEnd = this.parseTime(sunrise_response.astronomical_twilight_end);

  // Check the time against the defined ranges in a logical order.
  if (current >= astroBegin && current < nauticalBegin) {
    return "Astronomical Twilight (Morning)";
  } else if (current >= nauticalBegin && current < civilBegin) {
    return "Nautical Twilight (Morning)";
  } else if (current >= civilBegin && current < sunrise) {
    return "Civil Twilight (Morning)";
  } else if (current >= sunrise && current < midday) {
    return "Morning";
  } else if (current >= midday && current < sunset) {
    return "Afternoon";
  } else if (current >= sunset && current < civilEnd) {
    return "Civil Twilight (Evening)";
  } else if (current >= civilEnd && current < nauticalEnd) {
    return "Nautical Twilight (Evening)";
  } else if (current >= nauticalEnd && current < astroEnd) {
    return "Astronomical Twilight (Evening)";
  } else {
    // This will cover times before astroBegin and after astroEnd.
    return "Night";
  }
}

}
