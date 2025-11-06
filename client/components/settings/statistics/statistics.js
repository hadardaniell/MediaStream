const ctx1 = document.getElementById('dailyViewsChart').getContext('2d');
new Chart(ctx1, {
  type: 'bar',
  data: {
    labels: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    datasets: [
      { label: 'Mini', data: [12, 19, 3, 5, 2, 3, 9], backgroundColor: '#53a6f2' },
      { label: 'Moana', data: [5, 6, 2, 8, 4, 3, 7], backgroundColor: '#90be6d' },
      { label: 'Spider', data: [2, 3, 4, 3, 2, 5, 6], backgroundColor: '#f9c74f' }
    ]
  },
  options: {
    scales: { y: { beginAtZero: true, ticks: { color: '#e1e6f0' } }, x: { ticks: { color: '#e1e6f0' } } },
    plugins: { legend: { labels: { color: '#e1e6f0' } } }
  }
});

const ctx2 = document.getElementById('genreChart').getContext('2d');
new Chart(ctx2, {
  type: 'pie',
  data: {
    labels: ['אקשן', 'אנימציה', 'דרמה', 'מדע בדיוני', 'קומדיה'],
    datasets: [{
      label: 'התפלגות צפייה',
      data: [30, 25, 20, 15, 10],
      backgroundColor: ['#f94144','#f3722c','#f9c74f','#90be6d','#577590']
    }]
  },
  options: {
    plugins: { legend: { labels: { color: '#e1e6f0' } } }
  }
});

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
