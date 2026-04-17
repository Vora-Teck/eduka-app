import * as API from "./modules/api.js";

async function getSyllabus() {
  showLoader("Loading Subjects...")
  try {
    let data = await API.getSyllabus();
    //console.log(data)
    if(data.status == "success") {
      let d = data.data;
      
      $(".sub-row").empty()
      for(let i in d) {
        let temp = `
        <div class="stat-card syl-card" data-id="${d[i].id}">
                  <div class="stat-card-header">
                    <div class="stat-card-icon primary">
                      <img src="/static/icons/books.svg" alt="">
                    </div>
                    <div class="stat-card-title">
                    ${truncateWord(d[i].subject.title, 30)}<br>
                    <div class="w-small">
                      <div class="sub-progress-con">
                        <div class="sub-progress"></div>
                      </div>
                      <span>60% done</span>
                    </div>
                    </div>
                    <div class="fa fa-chevron-right w-right"></div>
                  </div>
                  
                </div>`;
        $(".sub-row").append(temp)
      }
      $(".syl-card").click(function() {
        let id = $(this).data('id');
        getSyllabusTopics(id);
      })
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
getSyllabus()


async function getSyllabusTopics(syllabus_id) {
  showLoader("Loading Topics...")
  try {
    let data = await API.getTopics({ syllabus_id });
    //console.log(data)
    if(data.status == "success") {
      let d = data.data;
      let s = data.syllabus
      $(".syl_name").html(`${s.subject.title}`)
      $(".s-topics").html(digify(s.no_of_topics))
      $(".s-staff").html(`${s.teacher?.firstName || 'No'} ${s.teacher?.lastName || 'Teacher'}`)
      $(".topics-container").empty()
      for(let i in d) {
        let temp = `
        <div class="stat-card syl-card" data-id="${d[i].id}">
                  <div class="stat-card-header">
                    <div class="stat-card-icon primary">
                      <img src="/static/icons/books.svg" alt="">
                    </div>
                    <div class="stat-card-title">
                    ${truncateWord(d[i].title, 35)}<br>
                    <div class="w-small">
                      <div class="sub-progress-con">
                        <div class="sub-progress"></div>
                      </div>
                      <span>60% done</span>
                    </div>
                    </div>
                    <div class="fa fa-chevron-right w-right"></div>
                  </div>
                  
                </div>`;
        //$(".topics-container").append(temp)
      }
      $(".topics-con").addClass('active')
      $(".syl-card").click(function() {
        let id = $(this).data('id');
        //getSyllabusTopics(id);
      })
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

