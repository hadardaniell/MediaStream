activeProfileId = localStorage.getItem('activeProfileId');

let userData = null;
let watchData = null;
let profilesCount = 0;
let dailyAverages = 0;
let watchedContentsCount = 0;

const userId = localStorage.getItem('userId');

const avgWatchTimeDay = document.getElementById('avgWatchTimeDay');
const contentsCount = document.getElementById('contentsCount');


document.addEventListener('DOMContentLoaded', async () => {
  await fetchProfilesCount(userId);
  document.getElementById('profilesCount').textContent = profilesCount;
  await Promise.all([
    fetchContentSortByLikes(),
    fetchWatchDataByProfile(activeProfileId),
  ]);

  avgWatchTimeDay.textContent = calculateOverallAverageWatchTimePerDay(watchData);
  contentsCount.textContent = countUniqueWatchedContents(watchData);
})

async function fetchProfilesCount(userId) {
  const res = await fetch(`http://localhost:3000/api/profiles?userId=${userId}`, {
    method: "GET",
    credentials: "include"
  }).then(res => res.json()).then(results => {
    profilesCount = results.length
  })

}

async function fetchContentSortByLikes() {
  const res = await fetch(`http://localhost:3000/api/content/?mode=likes`);
  const contentData = await res.json();

  const genreStats = {};
  contentData.forEach(item => {
    item.genres?.forEach(genre => {
      genreStats[genre] = (genreStats[genre] || 0) + 1;
    });
  });

  const labels = Object.keys(genreStats);
  const data = Object.values(genreStats);

  const ctx2 = document.getElementById('genreChart');
  new Chart(ctx2, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'התפלגות צפייה',
        data: data,
        backgroundColor: disneyColors
      }]
    },
    options: {
      plugins: { legend: { labels: { color: '#e1e6f0' } } }
    }
  });
}

async function fetchWatchDataByProfile(profileId) {
  const res = await fetch(`http://localhost:3000/api/watches/${profileId}`);
  watchData = await res.json();

  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const dailyCounts = [0, 0, 0, 0, 0, 0, 0];

  watchData.forEach(watch => {
    const date = new Date(watch.updatedAt);
    const dayIndex = date.getDay();
    dailyCounts[dayIndex] += 1;
  });

  const ctx = document.getElementById('dailyViewsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: 'צפיות יומיות',
          data: dailyCounts,
          backgroundColor: '#53a6f2'
        }
      ]
    },
    options: {
      scales: {
        y: { beginAtZero: true, ticks: { color: '#e1e6f0' } },
        x: { ticks: { color: '#e1e6f0' } }
      },
      plugins: { legend: { labels: { color: '#e1e6f0' } } }
    }
  });
}

function countUniqueWatchedContents(watchData) {
  // אוסף את כל ה־contentId ל־Set כדי לקבל ייחודיים
  const uniqueContentIds = new Set();

  watchData.forEach(watch => {
    if (watch.contentId) {
      uniqueContentIds.add(watch.contentId);
    }
  });

  return uniqueContentIds.size;
}


function calculateOverallAverageWatchTimePerDay(watchData) {
  if (!watchData.length) return 0;

  // אובייקט לשמירת סך שניות לכל יום
  const dailyTotals = {};

  watchData.forEach(watch => {
    const date = new Date(watch.updatedAt);
    const day = date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!dailyTotals[day]) dailyTotals[day] = 0;
    dailyTotals[day] += watch.progressSeconds || 0;
  });

  // סכום כל השניות
  const totalSeconds = Object.values(dailyTotals).reduce((sum, sec) => sum + sec, 0);
  const numberOfDays = Object.keys(dailyTotals).length;

  // ממוצע שעות לכל יום
  const avgHoursPerDay = (totalSeconds / numberOfDays) / 3600;

  return parseFloat(avgHoursPerDay.toFixed(4));
}




// async function fetchUserData(profileId) {
//   await fetch('http://localhost:3000/api/auth/me').then(res =>
//     res.json())
// }

const disneyColors = [
  '#0A2540', // כחול כהה עמוק
  '#1E3A8A', // כחול דיסני קלאסי
  '#2563EB', // כחול בוהק
  '#38BDF8', // טורקיז-בהיר
  '#60A5FA', // כחול תכלת רך
  '#6366F1', // כחול-סגול
  '#A78BFA', // סגול לילך
  '#7DD3FC', // תכלת עדין
  '#1E40AF'  // כחול כהה נוסף לקונטרסט
];

function goTo(page) {
  switch (page) {
    case "manage-account":
      window.location.href = "/manage-account";
      break;
    case "manage-profiles":
      window.location.href = "/manage-profiles";
      break;
    case "statistics":
      window.location.href = "/statistics";
      break;
  }
}
