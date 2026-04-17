import * as API from "./modules/api.js";

async function getTimetable() {
  showLoader("Loading Profile...")
  try {
    let data = await API.getTimetable();
    //console.log(data)
    if(data.status == "success") {
      let d = data.data;
      let t = data.term;
      let p = d.period;
      let [mon, tue, wed, thu, fri] = [d.monday, d.tuesday, d.wednesday, d.thursday, d.friday];

      $(".time-row").empty()
      for(let i in mon) {
        let temp = `
        <tr>
          <td>${timify(p[i].start)} - ${timify(p[i].end)}</td>
          <td>${mon[i].subject}</td>
        </tr>`;
        $(".mon-row").append(temp)
      }
      for(let i in tue) {
        let temp = `
        <tr>
          <td>${timify(p[i].start)} - ${timify(p[i].end)}</td>
          <td>${tue[i].subject}</td>
        </tr>`;
        $(".tue-row").append(temp)
      }
      for(let i in fri) {
        let temp = `
        <tr>
          <td>${timify(p[i].start)} - ${timify(p[i].end)}</td>
          <td>${fri[i].subject}</td>
        </tr>`;
        $(".fri-row").append(temp)
      }
      for(let i in wed) {
        let temp = `
        <tr>
          <td>${timify(p[i].start)} - ${timify(p[i].end)}</td>
          <td>${wed[i].subject}</td>
        </tr>`;
        $(".wed-row").append(temp)
      }
      for(let i in thu) {
        let temp = `
        <tr>
          <td>${timify(p[i].start)} - ${timify(p[i].end)}</td>
          <td>${thu[i].subject}</td>
        </tr>`;
        $(".thu-row").append(temp)
      }
      if(t) {
        $(".curr-t").html(t.title);
        $(".t-end").html(datify(t.end_date));
        $(".t-weeks").html(t.number_of_weeks);
        $(".curr-week").html(`Week ${getWeeks(t.start_date, t.end_daate)}`)
      }
    }
    else {
      pushNotification("n_error", data.message, 3000)
    }
  }
  catch(err) {
    console.log(err)
    pushNotification("n_error", err?.message, 3000)
  }
  hideLoader()
}
getTimetable()



window.addEventListener('online', checkNetwork)
window.addEventListener('offline', checkNetwork)

window.addEventListener('message', async function(ev) {
        try {
          const data = ev.data;
          
        }
        catch (e) {
          console.log(e)
        }
    });

