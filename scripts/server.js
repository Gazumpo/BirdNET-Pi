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

function isValidDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getValidatedDate(req, res, fieldName) {
  const value = req.query[fieldName];
  if (!isValidDate(value)) {
    res.status(400).json({ error: `Invalid ${fieldName} parameter` });
    return null;
  }
  return value;
}

function getValidatedBird(req, res) {
  const bird = req.query.bird;
  if (typeof bird !== 'string' || bird.trim() === '') {
    res.status(400).json({ error: 'Missing bird parameter' });
    return null;
  }
  return bird;
}

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''");
}

function getStationToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Perth" }).slice(0, 10);
}

function parseStationDate(dateString) {
  if (!isValidDate(dateString)) {
    return null;
  }
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatStationDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function dateDiffInDays(date1, date2) {
  const first = parseStationDate(date1);
  const second = parseStationDate(date2);
  if (!first || !second) {
    return null;
  }
  return Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
}

// API: Get last 50 rows
app.get('/latest', async (req, res) => {
  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const items = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
  const bird = typeof req.query.bird === 'string' && req.query.bird.trim() !== '' ? escapeSqlString(req.query.bird.trim()) : null;
  const sql = bird
    ? `SELECT * FROM detections WHERE Sci_Name = '${bird}' ORDER BY Date DESC, Time DESC LIMIT ${items}`
    : `SELECT * FROM detections ORDER BY Date DESC, Time DESC LIMIT ${items}`;

  try {
    const rows = await runQuery(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching data:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: Get today
app.get('/day', async (req, res) => {
  let date = '';

  if (!req.query.date) { 
    date = getStationToday();
  } else {
    date = getValidatedDate(req, res, 'date');
    if (!date) {
      return;
    }
  }

  try {
    const rows = await runQuery(`SELECT * FROM detections WHERE Date = '${date}' ORDER BY Date DESC`);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching data:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/best', async (req, res) => {
  const bird = getValidatedBird(req, res);
  if (!bird) {
    return;
  }

  try {
    const rows = await runQuery(`SELECT * FROM detections WHERE Sci_Name = '${escapeSqlString(bird)}' ORDER BY Confidence DESC LIMIT 1`);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching data:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/stats-all", async (req, res) => {
  try {
    const numDetectSql = "SELECT COUNT(*) AS COUNT FROM detections";
    const uniqueBirdsSql = "SELECT COUNT(DISTINCT Sci_Name) AS uniqueCount FROM detections";
    const numDaysSql = "SELECT COUNT(DISTINCT Date) AS days FROM detections";
    const avgSpeciesDailySql = "SELECT AVG(distinct_species_count) AS average_species_per_day FROM (SELECT Date, COUNT(DISTINCT Sci_Name) AS distinct_species_count FROM detections GROUP BY Date) AS daily_species_counts";

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
      avgDetectionsDaily: numDays[0].days === 0 ? 0 : numDetect[0].COUNT / numDays[0].days,
      avgSpeciesDaily: avgDaily[0].average_species_per_day
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/stats-day", async (req, res) => {
  try {
    const date = getValidatedDate(req, res, 'date');
    if (!date) {
      return;
    }

    const [numDetectToday, uniqueBirdsToday, newSpeciesToday, speciesToday] = await Promise.all([
      runQuery(`SELECT COUNT(*) AS COUNT FROM detections WHERE Date = '${date}'`),
      runQuery(`SELECT COUNT(DISTINCT Sci_Name) AS uniqueCountToday FROM detections WHERE Date = '${date}'`),
      runQuery(
        `SELECT DISTINCT d1.Com_Name, d1.Sci_Name FROM detections d1 WHERE d1.Date = '${date}' AND NOT EXISTS (SELECT 1 FROM detections d2 WHERE d2.Sci_Name = d1.Sci_Name AND d2.Date <> '${date}')`
      ),
      runQuery(`SELECT DISTINCT Sci_Name FROM detections WHERE Date = '${date}'`)
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
    const date1 = getValidatedDate(req, res, 'date1');
    if (!date1) {
      return;
    }
    const date2 = getValidatedDate(req, res, 'date2');
    if (!date2) {
      return;
    }
    
    const [birds, numDetect, uniqueBirds] = await Promise.all([
      runQuery(
        `SELECT DISTINCT(Com_Name), Sci_Name, COUNT(*) AS detections FROM detections WHERE Date BETWEEN '${date1}' AND '${date2}' GROUP By Com_Name ORDER BY COUNT(*) DESC`
      ),
      runQuery(`SELECT COUNT(*) AS COUNT FROM detections WHERE Date BETWEEN '${date1}' AND '${date2}'`),
      runQuery(`SELECT COUNT(DISTINCT Sci_Name) AS uniqueCountToday FROM detections WHERE Date BETWEEN '${date1}' AND '${date2}'`)
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
    const uniqueBirdsSql = "SELECT Com_Name, Sci_Name, COUNT(DISTINCT Date) as numberDaysDetection, COUNT(*) AS numberDetections FROM detections GROUP BY Com_Name, Sci_Name ORDER BY numberDaysDetection DESC";
    const numDaysSql = "SELECT COUNT(DISTINCT Date) AS days FROM detections";

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
    const bird = getValidatedBird(req, res);
    if (!bird) {
      return;
    }

    const [numDetect, numDetectToday, comName, numDays, numTotalDetect, detectionDates, firstAndLastHeard, previousHeard] = await Promise.all([
      runQuery(`SELECT COUNT(*) AS COUNT FROM detections WHERE Sci_Name = '${escapeSqlString(bird)}'`),
      runQuery(`SELECT COUNT(DISTINCT Date) AS days FROM detections WHERE Sci_Name = '${escapeSqlString(bird)}'`),
      runQuery(`SELECT Com_Name FROM detections WHERE Sci_Name = '${escapeSqlString(bird)}'`),
      runQuery('SELECT COUNT(DISTINCT Date) AS days FROM detections'),
      runQuery('SELECT COUNT(*) AS COUNT FROM detections'),
      runQuery(`SELECT Date, COUNT(Date) AS COUNT FROM detections WHERE Sci_Name = '${escapeSqlString(bird)}' GROUP BY Date`),
      runQuery(`SELECT MIN(Date) AS firstHeard, MAX(Date) AS lastHeard FROM detections WHERE Sci_Name = '${escapeSqlString(bird)}'`),
      runQuery(
        `SELECT MAX(Date) AS previousHeard FROM detections WHERE Sci_Name = '${escapeSqlString(bird)}' AND Date < (SELECT MAX(Date) FROM detections WHERE Sci_Name = '${escapeSqlString(bird)}')`
      )
    ]);

    const returnGapDays = previousHeard[0].previousHeard
      ? dateDiffInDays(previousHeard[0].previousHeard, firstAndLastHeard[0].lastHeard)
      : null;

    res.json({
      Sci_Name: bird,
      Com_Name: comName[0].Com_Name,
      numberDetections: numDetect[0].COUNT,
      numberDaysDetection: numDetectToday[0].days,
      percentDaily: 100 * (numDetectToday[0].days / numDays[0].days),
      percentTotal: numDetect[0].COUNT / numTotalDetect[0].COUNT,
      detectionDatesCount: detectionDates,
      firstHeard: firstAndLastHeard[0].firstHeard,
      lastHeard: firstAndLastHeard[0].lastHeard,
      previousHeard: previousHeard[0].previousHeard,
      returnGapDays,
      hasRecentReturn: returnGapDays !== null && returnGapDays >= 30
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
      if (lastTime === null) lastTime = row.Time;
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
