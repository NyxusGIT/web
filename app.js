const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
)

async function initLoginPage(){

    const session = await supabaseClient.auth.getSession()

    if(session.data.session){
        window.location.href = "/dashboard.html"
    }

    const btn = document.getElementById("loginBtn")

    btn.onclick = async () => {

        const email = document.getElementById("email").value.trim()

        const password = document.getElementById("password").value

        const error = document.getElementById("error")

        error.innerText = ""

        if(!email || !password){
            error.innerText = "Isi semua"
            return
        }

        const login = await supabaseClient.auth.signInWithPassword({
            email:email,
            password:password
        })

        if(login.error){
            error.innerText = "Login gagal"
            return
        }

        window.location.href = "/dashboard.html"

    }

}

async function initDashboardPage(){

    const session = await supabaseClient.auth.getSession()

    if(!session.data.session){
        window.location.href = "/"
        return
    }

    document.getElementById("logoutBtn").onclick = async () => {

        await supabaseClient.auth.signOut()

        window.location.href = "/"

    }

    loadVideos()

    setInterval(loadVideos,1000)

}

async function loadVideos(){

    try{

        const res = await fetch(
            RAW_VIDEO_URL + "?t=" + Date.now()
        )

        const data = await res.json()

        let videos = []

        if(Array.isArray(data)){
            videos = data
        }else if(data.videos){
            videos = data.videos
        }

        renderVideos(videos)

    }catch(err){

        document.getElementById("videoGrid").innerHTML = `
            <div class="empty">
                Gagal load video
            </div>
        `

    }

}

function renderVideos(videos){

    const grid = document.getElementById("videoGrid")

    if(!videos || videos.length === 0){

        grid.innerHTML = `
            <div class="empty">
                Tidak ada video
            </div>
        `

        return
    }

    let html = ""

    videos.forEach(v => {

        if(!v.url) return

        html += `
            <div class="video-card" onclick="playVideo('${v.url}')">

                <div class="video-thumb">
                    ▶
                </div>

                <div class="video-info">
                    <h4>${escapeHtml(v.title || 'Tanpa Judul')}</h4>
                </div>

            </div>
        `

    })

    grid.innerHTML = html

}

function playVideo(url){

    const container = document.getElementById("playerContainer")

    if(url.includes("youtu.be") || url.includes("youtube.com")){

        const id = getYoutubeId(url)

        container.innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/${id}"
                allowfullscreen>
            </iframe>
        `

        return
    }

    if(url.endsWith(".m3u8")){

        container.innerHTML = `
            <video id="player" controls playsinline></video>
        `

        const video = document.getElementById("player")

        const hls = new Hls()

        hls.loadSource(url)

        hls.attachMedia(video)

        return
    }

    container.innerHTML = `
        <video controls autoplay playsinline>
            <source src="${url}">
        </video>
    `

}

function getYoutubeId(url){

    const reg = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/

    const match = url.match(reg)

    return match ? match[1] : ""

}

function escapeHtml(text){

    const div = document.createElement("div")

    div.textContent = text

    return div.innerHTML

}