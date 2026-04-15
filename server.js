const express = require('express');
const { execSync } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Cấu hình giao diện cực đơn giản cho điện thoại Java
const header = `
<body style="font-family:sans-serif; background:#fff; margin:0; padding:5px;">
    <div style="background:#ff0000; padding:10px; color:#fff; font-weight:bold; text-align:center;">NINH BÌNH MEDIA</div>
    <form action="/" method="get" style="margin:10px 0; text-align:center;">
        <input type="text" name="q" placeholder="Tìm video..." style="width:60%; padding:5px;">
        <input type="submit" value="Tìm" style="padding:5px;">
    </form>
`;

// Trang chủ & Tìm kiếm
app.get('/', (req, res) => {
    const q = req.query.q || "music";
    try {
        // Lệnh chạy yt-dlp với quyền thực thi tại chỗ (./yt-dlp)
        const cmd = `./yt-dlp "ytsearch10:${q}" --dump-json --flat-playlist --no-check-certificates`;
        const stdout = execSync(cmd, { maxBuffer: 1024 * 1024 * 10 }).toString();
        
        const videos = stdout.trim().split('\n').map(line => JSON.parse(line));

        let html = header + `<table width="100%" border="0" cellspacing="5">`;

        videos.forEach(v => {
            html += `
                <tr>
                    <td width="120" valign="top">
                        <a href="/v/${v.id}">
                            <img src="${v.thumbnails[0].url}" width="120" style="border:1px solid #ccc; border-radius:5px;">
                        </a>
                    </td>
                    <td valign="top" style="font-size:14px; font-weight:bold;">
                        <a href="/v/${v.id}" style="text-decoration:none; color:#333;">${v.title}</a>
                    </td>
                </tr>`;
        });

        html += `</table></body>`;
        res.send(html);
    } catch (e) {
        console.error(e);
        res.send(header + `<p style="text-align:center; color:red;">Lỗi kết nối YouTube hoặc IP bị chặn. Hãy thử tìm kiếm từ khóa khác!</p></body>`);
    }
});

// Trang xem video
app.get('/v/:id', (req, res) => {
    const id = req.params.id;
    try {
        // Lấy link 3GP (itag 17) và Audio (itag 140)
        const linkVideo = execSync(`./yt-dlp -g -f "17/160/worst" --no-check-certificates https://www.youtube.com/watch?v=${id}`).toString().trim();
        const linkAudio = execSync(`./yt-dlp -g -f "140/bestaudio" --no-check-certificates https://www.youtube.com/watch?v=${id}`).toString().trim();

        let html = `
            <body style="font-family:sans-serif; padding:10px; text-align:center;">
                <div style="text-align:left; margin-bottom:10px;"><a href="/" style="text-decoration:none;">&lt; Quay lại</a></div>
                <img src="https://img.youtube.com/vi/${id}/0.jpg" width="100%" style="border-radius:10px;"><br>
                <div style="margin:20px 0;">
                    <a href="${linkVideo}" style="display:block; background:#ff0000; color:#fff; padding:15px; text-align:center; text-decoration:none; font-weight:bold; border-radius:8px; margin-bottom:15px;">XEM VIDEO (3GP / 144P)</a>
                    <a href="${linkAudio}" style="display:block; background:#28a745; color:#fff; padding:15px; text-align:center; text-decoration:none; font-weight:bold; border-radius:8px;">NGHE NHẠC (M4A)</a>
                </div>
                <p style="font-size:12px; color:#666;">Dành cho điện thoại Java & đời cũ</p>
            </body>`;
        res.send(html);
    } catch (e) {
        res.send(header + `<p style="text-align:center;">Không thể lấy link video này. Thử video khác nhé!</p></body>`);
    }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
