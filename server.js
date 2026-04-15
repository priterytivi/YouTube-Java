const express = require('express');
const { execSync } = require('child_process');
const app = express();
const port = process.env.PORT || 3000; // Render sẽ tự điền PORT vào đây

app.set('view engine', 'ejs'); // Sử dụng EJS để render HTML dễ dàng

// Trang chủ & Tìm kiếm
app.get('/', (req, res) => {
    const q = req.query.q || "music";
    try {
        
        const cmd = `yt-dlp "ytsearch10:${q}" --dump-json --flat-playlist`;
        const stdout = execSync(cmd, { maxBuffer: 1024 * 1024 * 5 }).toString();
        const videos = stdout.trim().split('\n').map(line => JSON.parse(line));

        // Tạo giao diện HTML thuần
        let html = `
            <body style="font-family:sans-serif; background:#fff; margin:0; padding:5px;">
                <div style="background:#f00; padding:10px; color:#fff; font-weight:bold;">YouTube Java</div>
                <form action="/" method="get" style="margin:10px 0;">
                    <input type="text" name="q" value="${q}" style="width:70%;">
                    <input type="submit" value="Tìm">
                </form>
                <table width="100%" border="0" cellspacing="5">`;

        videos.forEach(v => {
            html += `
                <tr>
                    <td width="120" valign="top">
                        <a href="/v/${v.id}">
                            <img src="${v.thumbnails[0].url}" width="120" style="border:1px solid #ccc;">
                        </a>
                    </td>
                    <td valign="top" style="font-size:12px;">
                        <a href="/v/${v.id}" style="text-decoration:none; color:#00f;">${v.title}</a>
                    </td>
                </tr>`;
        });

        html += `</table></body>`;
        res.send(html);
    } catch (e) {
        res.send("Connection error, please try again!");
    }
});

// Trang xem video (Chi tiết)
app.get('/v/:id', (req, res) => {
    const id = req.params.id;
    try {
        // Lấy link trực tiếp 3GP (itag 17) và Audio (itag 140)
        const linkVideo = execSync(`yt-dlp -g -f "17/160/worst" https://www.youtube.com/watch?v=${id}`).toString().trim();
        const linkAudio = execSync(`yt-dlp -g -f "140/bestaudio" https://www.youtube.com/watch?v=${id}`).toString().trim();

        let html = `
            <body style="font-family:sans-serif; padding:10px;">
                <a href="/">&lt; Quay lại</a><br><br>
                <img src="https://img.youtube.com/vi/${id}/0.jpg" width="100%"><br>
                <div style="margin:10px 0;">
                    <a href="${linkVideo}" style="display:block; background:#f00; color:#fff; padding:15px; text-align:center; text-decoration:none; font-weight:bold; margin-bottom:10px;">VIDEO</a>
                    <a href="${linkAudio}" style="display:block; background:#080; color:#fff; padding:15px; text-align:center; text-decoration:none; font-weight:bold;">AUDIO</a>
                </div>
            </body>`;
        res.send(html);
    } catch (e) {
        res.send("Unable to get the stream link.");
    }
});

app.listen(port, () => console.log('Web Java v1.0 running...'));

