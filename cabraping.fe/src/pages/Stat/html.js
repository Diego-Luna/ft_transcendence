
export async function Stat_html() {
  return `
    <div class="container-sm min-vh-100">
      <h2>Dashboard</h2>
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <a class="nav-link stat-nav-link" href="#" data-target="wins-losses">Leaderboard</a>
        </li>
        <li class="nav-item">
          <a class="nav-link stat-nav-link" href="#" data-target="history">Match History</a>
        </li>
        <li class="nav-item">
          <a class="nav-link stat-nav-link" href="#" data-target="selfstats">Personal Stats</a>
        </li>
      </ul>
      <div class="stat-block" id="wins-losses" style="display: none;">
        <h3>Wins and Losses</h3>
        <table class="table table-bordered" id="wins-losses-table">
          <tbody id="leaderboard"></tbody>
        </table>
      </div>
      <div class="stat-block" id="history" style="display: none;">
        <h3>Match History</h3>
        <table class="table table-bordered" id="match-history-table">
          <thead>
            <tr>
              <th class="table-dark">Winner</th>
              <th class="table-dark">Loser</th>
              <th class="table-dark">Score</th>
              <th class="table-dark">Time</th>
              <th class="table-dark">Date</th>
            </tr>
          </thead>
          <tbody id="history-list"></tbody>
        </table>
      </div>
      <div class="stat-block" id="selfstats" style="display: none;">
        <h3>Personal Stats</h3>
        <div class="d-flex align-items-start">
          <img id="avatarImageURL" src="" class="rounded" alt="Avatar" style="max-width: 300px; height: 300px; object-fit: cover;">
          <table class="table">
            <tbody>
              <tr class="table-active">
                <th class="col-2">Username:</th>
                <td id="username"></td>
              </tr>
              <tr>
                <th>First name:</th>
                <td id="first_name"></td>
              </tr>
              <tr class="table-active">
                <th>Last name:</th>
                <td id="last_name"></td>
              </tr>
              <tr>
                <th>Games played:</th>
                <td id="played"></td>
              </tr>
              <tr class="table-active">
                <th>Games won:</th>
                <td id="wins"></td>
              </tr>
              <tr>
                <th>Games lost:</th>
                <td id="losses"></td>
              </tr>
              <tr class="table-active">
                <th>Tournaments won:</th>
                <td id="championships"></td>
              </tr>
            </tbody>
          </table>
        </div> 
      </div>
    </div>
  `;
}



