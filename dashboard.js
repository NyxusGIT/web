const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
)

let currentPlayer = null
let currentHls = null
let lastHash = ""
let updateCounter = 0
let updateInterval = null

const playerContainer =
document.getElementById("playerContainer")

const videoGrid =
document.getElementById("videoGrid")

const logDiv =
document.getElementById("log")

const updateStatus =
document.getElementById("updateStatus")

const updateCountSpan =
document.getElementById("updateCount")

const refreshBtn =
document.getElementById("refreshBtn")

const logoutBtn =
document.getElementById("logoutBtn")

async function protectDashboard(){

    const { data } =
    await supabaseClient
    .auth
    .getSession()

    if(!data.session){

        location.href = "/"

        return

    }

}

protectDashboard()

logoutBtn.addEventListener(
"click",
async () => {

    await supabaseClient
    .auth
    .signOut()

    location.href = "/"

})

function escapeHtml(text){

    const div =
    document.createElement("div")

    div.textContent = text

    return div.innerHTML

}

function getVideoData(url){

    if(!url) return null

    let match =
    url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/
    )

    if(match){

        return {

            type:"youtube",

            embed:
            `https://www.youtube.com/embed/${match[1]}`

        }

    }

    match =
    url.match(/vimeo\.com\/(\d+)/)

    if(match){

        return {

            type:"vimeo",

            embed:
            `https://player.vimeo.com/video/${match[1]}`

        }

    }

    if(url.includes("videy.co")){

        let id = ""

        if(url.includes("?id=")){

            id =
            url
            .split("id=")[1]
            .split("&")[0]

        }else{

            id =
            url.split("/").pop()

        }

        return {

            type:"direct",

            url:
            `https://cdn.videy.co/${id}.mp4`

        }

    }

    if(url.includes("kingvidey.com")){

        let id = ""

        if(url.includes("?id=")){

            id =
            url
            .split("id=")[1]
            .split("&")[0]

        }else{

            id =
            url.split("/").pop()

        }

        return {

            type:"direct",

            url:
            `https://cdn.kingvidey.com/${id}.mp4`

        }

    }

    if(url.endsWith(".m3u8")){

        return {

            type:"hls",
            url:url

        }

    }

    if(
        url.includes(".mp4") ||
        url.startsWith("http")
    ){

        return {

            type:"direct",
            url:url

        }

    }

    return null

}

async function playMedia(url){

    const data =
    getVideoData(url)

    if(!data){

        logDiv.innerText =
        "Link tidak valid"

        return

    }

    logDiv.innerText =
    "Loading..."

    if(currentPlayer){

        currentPlayer.destroy()

        currentPlayer = null

    }

    if(currentHls){

        currentHls.destroy()

        currentHls = null

    }

    if(
        data.type === "youtube" ||
        data.type === "vimeo"
    ){

        playerContainer.innerHTML = `
            <iframe
                src="${data.embed}"
                allowfullscreen
                allow="autoplay"
            ></iframe>
        `

        logDiv.innerText =
        "READY"

        return

    }

    if(
        data.type === "hls" &&
        Hls.isSupported()
    ){

        playerContainer.innerHTML = `
            <video
                id="player"
                controls
                playsinline
            ></video>
        `

        const video =
        document.getElementById("player")

        currentHls = new Hls()

        currentHls.loadSource(data.url)

        currentHls.attachMedia(video)

        currentHls.on(
            Hls.Events.MANIFEST_PARSED,
            () => {

                video.play()

                logDiv.innerText =
                "PLAYING"

            }
        )

        return

    }

    playerContainer.innerHTML = `
        <video
            id="player"
            controls
            playsinline
            crossorigin="anonymous"
        >
            <source src="${data.url}">
        </video>
    `

    const video =
    document.getElementById("player")

    currentPlayer =
    new Plyr(video)

    video.onloadeddata = () => {

        video.play()

        logDiv.innerText =
        "PLAYING"

    }

    video.onerror = () => {

        logDiv.innerText =
        "Video error"

    }

}

function renderVideos(videos){

    if(!videos || videos.length === 0){

        videoGrid.innerHTML = `
            <div class="empty-state">
                Tidak ada video
            </div>
        `

        return

    }

    let html = ""

    for(let i = 0; i < videos.length; i++){

        const v = videos[i]

        if(
            !v.url ||
            !v.title
        ){
            continue
        }

        html += `
            <div
                class="video-card"
                data-url="${escapeHtml(v.url)}"
            >

                <div class="video-thumb">
                    ▶
                </div>

                <div class="video-info">
                    <h4>
                        ${escapeHtml(v.title)}
                    </h4>
                </div>

            </div>
        `
    }

    if(html === ""){

        videoGrid.innerHTML = `
            <div class="empty-state">
                Tidak ada video valid
            </div>
        `

        return

    }

    videoGrid.innerHTML = html

    document
    .querySelectorAll(".video-card")
    .forEach(card => {

        card.addEventListener(
        "click",
        () => {

            const url =
            card.getAttribute("data-url")

            playMedia(url)

        })

    })

}

async function fetchVideos(){

    try{

        updateStatus.innerText =
        "Checking..."

        const response =
        await fetch(
            RAW_VIDEO_URL +
            "?t=" +
            Date.now()
        )

        const data =
        await response.json()

        const hash =
        JSON.stringify(data)

        if(hash !== lastHash){

            lastHash = hash

            updateCounter++

            updateCountSpan.innerText =
            updateCounter

            updateStatus.innerText =
            "Update ditemukan"

            if(Array.isArray(data)){

                renderVideos(data)

            }else{

                renderVideos(
                    data.videos || []
                )

            }

        }else{

            updateStatus.innerText =
            "Tidak ada perubahan"

        }

    }catch(err){

        updateStatus.innerText =
        "Gagal mengambil data"

    }

}

function startAutoUpdate(){

    if(updateInterval){

        clearInterval(updateInterval)

    }

    fetchVideos()

    updateInterval =
    setInterval(() => {

        fetchVideos()

    },1000)

}

refreshBtn.addEventListener(
"click",
() => {

    fetchVideos()

})

startAutoUpdate()