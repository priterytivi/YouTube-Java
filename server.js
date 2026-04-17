const express = require('express');
const { execSync } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Giao diện tối ưu cho điện thoại Java
const header = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ONNA Tube</title>
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
        // Lấy 10 video, thêm cơ chế chống chặn SSL
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

        html += `</table><div style="text-align:center; font-size:10px; color:#aaa; margin-top:10px;">ONNA Tube v2.0</div></body></html>`;
        res.send(html);
    } catch (e) {
        res.send(header + `<p style="text-align:center; color:red;">Server đang bận hoặc từ khóa không hợp lệ. Vui lòng thử lại!</p></body></html>`);
    }
});

// Trang chi tiết lấy link stream
app.get('/v/:id', (req, res) => {
    const id = req.params.id;
    try {
        // Giả lập User Agent của Nokia để YouTube ưu tiên nhả link 3GP
        const nokiaUA = "Mozilla/5.0 (SymbianOS/9.4; Series60/5.0 NokiaN97-1/20.0.019; Profile/MIDP-2.1 Configuration/CLDC-1.1) AppleWebKit/525 (KHTML, like Gecko) BrowserNG/7.1.18124";
        
        // Lệnh lấy link: Ưu tiên itag 17 (3GP), nếu không có lấy bản thấp nhất (worst)
        const cmdVideo = `./yt-dlp -g -f "17/worst" --user-agent "${nokiaUA}" --no-check-certificates https://www.youtube.com/watch?v=${id}`;
        const cmdAudio = `./yt-dlp -g -f "140/bestaudio" --no-check-certificates https://www.youtube.com/watch?v=${id}`;

        const linkVideo = execSync(cmdVideo).toString().trim();
        const linkAudio = execSync(cmdAudio).toString().trim();

        res.send(`
            <!DOCTYPE html>
            <html>
            <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="font-family:sans-serif; padding:10px; text-align:center; background:#f9f9f9;">
                <div style="text-align:left; margin-bottom:15px;"><a href="/" style="text-decoration:none; color:#ff0000; font-weight:bold;">&lt; TRỞ LẠI</a></div>
                <img src="https://img.youtube.com/vi/${id}/0.jpg" width="100%" style="border-radius:10px; border:1px solid #ddd;"><br>
                <div style="margin:20px 0;">
                    <p style="font-size:12px; color:#666;">Choose the appropriate format for your device:</p>
                    <a href="${linkVideo}" style="display:block; background:#ff0000; color:#fff; padding:15px; text-align:center; text-decoration:none; font-weight:bold; border-radius:8px; margin-bottom:15px;">VIDEO (3GP / 144p)</a>
                    <a href="${linkAudio}" style="display:block; background:#28a745; color:#fff; padding:15px; text-align:center; text-decoration:none; font-weight:bold; border-radius:8px;">AUDIO (M4A)</a>
                </div>
                <p style="font-size:10px; color:#888;">Note: Some newer videos may not support native 3GP.</p>
            </body>
            </html>`);
    } catch (e) {
        console.error(e);
        res.send(header + `<p style="text-align:center; color:red;">Error: YouTube has blocked the request, or the video does not have a supported format.</p><div style="text-align:center;"><a href="/">Quay lại</a></div></body></html>`);
    }
});

app.listen(port, () => {
    console.log("The server is running at the port: " + port);
});
