const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();
const port = process.env.PORT || 3000;

const header = `
<body style="font-family:sans-serif; background:#fff; margin:0; padding:5px;">
    <div style="background:#ff0000; padding:10px; color:#fff; font-weight:bold; text-align:center;">ONNA Tube - JAVA</div>
    <form action="/" method="get" style="margin:10px 0; text-align:center;">
        <input type="text" name="v" placeholder="Dán link YouTube hoặc ID..." style="width:70%; padding:5px;">
        <input type="submit" value="Lấy link">
    </form>
`;

app.get('/', async (req, res) => {
    const videoURL = req.query.v;
    if (!videoURL) {
        return res.send(header + `<p style="text-align:center;">Hãy nhập ID video để bắt đầu!</p></body>`);
    }

    try {
        const info = await ytdl.getInfo(videoURL);
        
        // 1. Tìm định dạng 3GP (itag 17)
        let format = info.formats.find(f => f.itag === 17);
        let note = "Định dạng: 3GP (144p)";

        // 2. Nếu không có 3GP, tìm MP4 thấp nhất (itag 18 hoặc 36 hoặc thấp nhất)
        if (!format) {
            format = ytdl.chooseFormat(info.formats, { quality: '144p', filter: 'audioandvideo' }) 
                     || ytdl.chooseFormat(info.formats, { quality: 'lowestvideo' });
            note = "Định dạng: MP4 (Chất lượng thấp)";
        }

        if (!format) throw new Error("Không tìm thấy định dạng phù hợp");

        res.send(`
            ${header}
            <div style="text-align:center; padding:10px;">
                <img src="${info.videoDetails.thumbnails[0].url}" width="100%" style="border-radius:8px;"><br>
                <p style="font-size:14px; font-weight:bold;">${info.videoDetails.title}</p>
                <p style="font-size:12px; color:green;">${note}</p>
                <a href="${format.url}" style="display:block; background:#ff0000; color:#fff; padding:15px; text-decoration:none; font-weight:bold; border-radius:8px;">XEM VIDEO NGAY</a>
                <br>
                <a href="/" style="color:#666; font-size:12px;">Quay lại</a>
            </div>
            </body>
        `);
    } catch (e) {
        console.error(e);
        res.send(header + `<p style="text-align:center; color:red;">Lỗi: YouTube chặn Replit hoặc Video không hỗ trợ 3GP/MP4 thấp. Hãy thử video khác!</p></body>`);
    }
});

app.listen(port, () => console.log("Web Onna Tube is running on port " + port));
