const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const WebSocket = require('ws');

const DB_PATH = 'birds.db'; 

const app = express();
app.use(cors());
app.use(express.static('/home/graeme/BirdSongs/Extracted/By_Date'));

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('Error opening database:', err.message);
  else console.log('Connected to SQLite database.');
});


function runQuery(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// API: Get last 50 rows
app.get('/latest', (req, res) => {
  const items = parseInt(req.query.limit) || 10;
  const bird = req.query.bird || null;

  let sql;
  if (bird) {
    sql = "SELECT * FROM detections WHERE Sci_Name = '" + bird + "'" + " ORDER BY Date DESC, Time DESC LIMIT " + items;
  } else {
    sql = 'SELECT * FROM detections ORDER BY Date DESC, Time DESC LIMIT ' + items;
  }

  console.log(sql)

  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching data:', err.message);
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// API: Get today
app.get('/day', (req, res) => {
  let date = ''

  if (!req.query.date) { 
    date = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10)
  } else {
    date = req.query.date
  }
  
  const sql = 'SELECT * FROM detections WHERE Date = \'' + date + '\' ORDER BY Date DESC' 

  db.all(sql, (err, rows) => {
    if (err) {
        console.error('Error fetching data:', err.message);
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get('/best', (req, res) => {
  let bird = req.query.bird
  
  let sql = "SELECT * FROM detections WHERE Sci_Name = '" + bird + "'" + " ORDER BY Confidence DESC LIMIT 1;";

  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching data:', err.message);
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows[0]);
    }
  });
});

app.get("/stats-all", async (req, res) => {
  try {
    let numDetectSql = "SELECT COUNT(*) AS COUNT FROM detections"
    let uniqueBirdsSql = "SELECT COUNT(DISTINCT Sci_Name) AS uniqueCount FROM detections"
    let numDaysSql = "SELECT COUNT(DISTINCT Date) AS days FROM detections"
    let avgSpeciesDailySql = "SELECT AVG(distinct_species_count) AS average_species_per_day FROM (SELECT Date, COUNT(DISTINCT Sci_Name) AS distinct_species_count FROM detections GROUP BY Date) AS daily_species_counts";

    const [numDetect, uniqueBirds, numDays, avgDaily] = await Promise.all([
      runQuery(numDetectSql),
      runQuery(uniqueBirdsSql),
      runQuery(numDaysSql),
      runQuery(avgSpeciesDailySql)
    ]);

    res.json({
      numberDetections: numDetect[0].COUNT,
      numberSpecies: uniqueBirds[0].uniqueCount,
      numberDays: numDays[0].days,
      avgSpeciesDaily: avgDaily[0].average_species_per_day
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/stats-day", async (req, res) => {
  try {
    let date = req.query.date

    let numDetectTodaySql = "SELECT COUNT(*) AS COUNT FROM detections WHERE Date = \'" + date + "\'"
    let uniqueBirdsTodaySql = "SELECT COUNT(DISTINCT Sci_Name) AS uniqueCountToday FROM detections WHERE Date = \'" + date + "\'"
    let newSpeciesTodaySql = "SELECT d1.Com_Name, d1.Sci_Name FROM detections d1 WHERE d1.Date = \'" + date + "\'" + " AND NOT EXISTS (SELECT 1 FROM detections d2 WHERE d2.Sci_Name = d1.Sci_Name AND d2.Date <> \'" + date + "\')"
    let speciesTodaySql = "SELECT DISTINCT Sci_Name FROM detections WHERE Date = \'" + date + "\'"

    const [numDetectToday, uniqueBirdsToday, newSpeciesToday, speciesToday] = await Promise.all([
      runQuery(numDetectTodaySql),
      runQuery(uniqueBirdsTodaySql),
      runQuery(newSpeciesTodaySql),
      runQuery(speciesTodaySql)
    ]);

    res.json({
      numberDetectionsToday: numDetectToday[0].COUNT,
      numberSpeciesToday: uniqueBirdsToday[0].uniqueCountToday,
      newSpeciesToday: newSpeciesToday,
      speciesToday: speciesToday.map(species => species.Sci_Name)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/stats-range", async (req, res) => {
  try {
    let date1 = req.query.date1
    let date2 = req.query.date2

    let birdssql = "SELECT DISTINCT(Com_Name), Sci_Name, COUNT(*) AS detections FROM detections WHERE Date BETWEEN \'" + date1 + "\' AND \'" + date2 + "\' GROUP By Com_Name ORDER BY COUNT(*) DESC"
    let numDetectql = "SELECT COUNT(*) AS COUNT FROM detections WHERE Date BETWEEN \'" + date1 + "\' AND \'" + date2 + "\'"
    let uniqueBirdsSql = "SELECT COUNT(DISTINCT Sci_Name) AS uniqueCountToday FROM detections WHERE Date BETWEEN \'" + date1 + "\' AND \'" + date2 + "\'"
    
    const [birds, numDetect, uniqueBirds] = await Promise.all([
      runQuery(birdssql),
      runQuery(numDetectql),
      runQuery(uniqueBirdsSql)
    ]);

    res.json({
      birds: birds,
      numberDetections: numDetect[0].COUNT,
      numberSpecies: uniqueBirds[0].uniqueCountToday
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/birds", async (req, res) => {
  try {
    //let uniqueBirdsSql = "SELECT Com_Name, COUNT(*) AS occurrences FROM detections GROUP BY Com_Name ORDER BY occurrences DESC";
    let uniqueBirdsSql = "SELECT Com_Name, Sci_Name, COUNT(DISTINCT Date) as numberDaysDetection, COUNT(*) AS numberDetections FROM detections GROUP BY Com_Name, Sci_Name ORDER BY numberDaysDetection DESC";
    let numDaysSql = "SELECT COUNT(DISTINCT Date) AS days FROM detections"

    const [birds, numDays] = await Promise.all([
      runQuery(uniqueBirdsSql),
      runQuery(numDaysSql)
    ]);

    birds.forEach(bird => {
      bird.percentDaily = (bird.numberDaysDetection / numDays[0].days) * 100;
    });

    res.json(birds);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/bird", async (req, res) => {
  try {
    let bird = req.query.bird

    let numDetectSql = "SELECT COUNT(*) AS COUNT FROM detections WHERE Sci_Name = '" + bird + "'"
    let numDaysDetectSql = "SELECT COUNT(DISTINCT Date) AS days FROM detections WHERE Sci_Name = '" + bird + "'"
    let comNameSql = "SELECT Com_Name FROM detections WHERE Sci_Name = '" + bird + "'"
    let numDaysSql = "SELECT COUNT(DISTINCT Date) AS days FROM detections"
    let numTotalDetectSql = "SELECT COUNT(*) AS COUNT FROM detections"
    let detectionDatesSql = "SELECT Date, COUNT(Date) AS COUNT FROM detections WHERE Sci_Name = '" + bird + "' GROUP BY Date"


    const [numDetect, numDetectToday, comName, numDays, numTotalDetect, detectionDates] = await Promise.all([
      runQuery(numDetectSql),
      runQuery(numDaysDetectSql),
      runQuery(comNameSql),
      runQuery(numDaysSql),
      runQuery(numTotalDetectSql),
      runQuery(detectionDatesSql)
    ]);

    res.json({
      Sci_Name: bird,
      Com_Name: comName[0].Com_Name,
      numberDetections: numDetect[0].COUNT,
      numberDaysDetection: numDetectToday[0].days,
      percentDaily: 100 * (numDetectToday[0].days / numDays[0].days),
      percentTotal: numDetect[0].COUNT / numTotalDetect[0].COUNT,
      detectionDatesCount: detectionDates
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Start HTTP server
const server = app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});

// WebSocket setup
const wss = new WebSocket.Server({ server });
let lastTime = null;

setInterval(() => {
  db.get('SELECT * FROM detections ORDER BY Date DESC LIMIT 1', (err, row) => {
    if (!err && row) {
      if (lastTime === null) lastTime = row.Time; // initialize
      if (row.Time !== lastTime) {
        lastTime = row.Time;
        console.log('New row detected:', lastTime);

        // Send message to all connected clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(row));
          }
        });
      }
    }
  });
}, 5000); // check every 5 seconds
