const express = require('express');
const { execSync } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Giao diện tối giản cho điện thoại cũ
const header = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NINH BÌNH MEDIA</title>
</head>
<body style="font-family:sans-serif; background:#fff; margin:0; padding:5px;">
    <div style="background:#ff0000; padding:10px; color:#fff; font-weight:bold; text-align:center; border-radius:5px;">NINH BÌNH MEDIA</div>
    <form action="/" method="get" style="margin:10px 0; text-align:center;">
        <input type="text" name="q" placeholder="Tìm video..." style="width:60%; padding:5px;">
        <input type="submit" value="Tìm" style="padding:5px; background:#333; color:#fff; border:none; border-radius:3px;">
    </form>
`;

// Trang chủ & Tìm kiếm video
app.get('/', (req, res) => {
    const q = req.query.q || "music";
    try {
        // Lệnh lấy danh sách 10 video từ YouTube
        const cmd = `./yt-dlp "ytsearch10:${q}" --dump-json --flat-playlist --no-check-certificates`;
        const stdout = execSync(cmd, { maxBuffer: 1024 * 1024 * 10 }).toString();
        const videos = stdout.trim().split('\n').map(line => JSON.parse(line));

        let html = header + `<table width="100%" border="0" cellspacing="5">`;

        videos.forEach(v => {
            const thumb = v.thumbnails && v.thumbnails[0] ? v.thumbnails[0].url : '';
            html += `
                <tr>
                    <td width="120" valign="top">
                        <a href="/v/${v.id}">
                            <img src="${thumb}" width="120" style="border:1px solid #ccc; border-radius:5px;">
                        </a>
                    </td>
                    <td valign="top" style="font-size:14px; font-weight:bold;">
                        <a href="/v/${v.id}" style="text-decoration:none; color:#333;">${v.title}</a>
                    </td>
                </tr>`;
        });

        html += `</table></body></html>`;
        res.send(html);
    } catch (e) {
        console.error(e);
        res.send(header + `<p style="text-align:center; color:red;">Đang tải dữ liệu từ YouTube, vui lòng đợi 30 giây rồi nhấn tải lại trang...</p></body></html>`);
    }
});

// Trang chi tiết để lấy link 3GP và Audio
app.get('/v/:id', (req, res) => {
    const id = req.params.id;
    try {
        // Trích xuất link trực tiếp 3GP (144p) và Audio (M4A)
        const linkVideo = execSync(`./yt-dlp -g -f "17/160/worst" --no-check-certificates https://www.youtube.com/watch?v=${id}`).toString().trim();
        const linkAudio = execSync(`./yt-dlp -g -f "140/bestaudio" --no-check-certificates https://www.youtube.com/watch?v=${id}`).toString().trim();

        res.send(`
            <!DOCTYPE html>
            <html>
            <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="font-family:sans-serif; padding:10px; text-align:center; background:#f9f9f9;">
                <div style="text-align:left; margin-bottom:15px;"><a href="/" style="text-decoration:none; color:#ff0000; font-weight:bold;">&lt; TRỞ LẠI</a></div>
                <img src="https://img.youtube.com/vi/${id}/0.jpg" width="100%" style="border-radius:10px; border:1px solid #ddd;"><br>
                <div style="margin:20px 0;">
                    <a href="${linkVideo}" style="display:block; background:#ff0000; color:#fff; padding:15px; text-align:center; text-decoration:none; font-weight:bold; border-radius:8px; margin-bottom:15px;">XEM VIDEO (3GP)</a>
                    <a href="${linkAudio}" style="display:block; background:#28a745; color:#fff; padding:15px; text-align:center; text-decoration:none; font-weight:bold; border-radius:8px;">NGHE NHẠC (AUDIO)</a>
                </div>
                <p style="font-size:12px; color:#888;">Ninh Bình Media - 2026</p>
            </body>
            </html>`);
    } catch (e) {
        console.error(e);
        res.send(header + `<p style="text-align:center; color:red;">Lỗi: Không thể lấy link stream cho video này!</p></body></html>`);
    }
});

// Khởi chạy server
app.listen(port, () => {
    console.log("Server dang chay tai cong: " + port);
});
