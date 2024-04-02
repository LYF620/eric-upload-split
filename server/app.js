// Node.js 后端
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
// Multer 是一个 node.js 中间件，用于处理 multipart/form-data 类型的表单数据，它主要用于上传文件。
// 它在 body-parser 无法处理文件上传的情况下使用。
// 当你使用 Multer 时，你可以访问 req.file 或 req.files 对象，这些对象包含了从表单发送的文件信息。

// dest 是上传文件的目标目录
const upload = multer({ dest: 'uploads/' });

// upload.single('file') 中的 'file' 是 HTML 表单中的文件输入字段的名称。这个名称是你在前端代码中定义的。
// 比如 <input type="file" name="file" />，那么这里就是 'file'。
// 比如 <input type="file" name="myFile" />，那么这里就是 'myFile'。

// 上传分片内容
app.post('/upload', upload.single('file'), (req, res) => {
  const { file } = req;
  // index:文件索引 文件hash


  const { index, hash } = req.body;
  console.log('upload+++++++++',hash, index);

  const chunkDir = path.resolve(__dirname, 'chunks', hash);


  if (!fs.existsSync(chunkDir)) {
    fs.mkdirSync(chunkDir);
  }

  fs.renameSync(file.path, `${chunkDir}/${index}`);
  res.end('uploaded');
});

// 合并分片内容
app.post('/merge', (req, res) => {
// 从请求体中获取 'hash' 和 'filename' 属性
console.log('merge+++++++++ start', req.body);

const { hash, filename } = req.body;

// 根据 'hash' 值构造文件块所在的目录路径
const chunkDir = path.resolve(__dirname, 'chunks', hash);


// 读取文件块目录中的所有文件块
const chunks = fs.readdirSync(chunkDir);

// 对文件块进行排序，确保它们按正确的顺序被合并
chunks.sort((a, b) => a - b);

// 创建一个写入流，用于将合并的文件写入到 'uploads' 目录
const writeStream = fs.createWriteStream(path.resolve(__dirname, 'uploads', filename));

// 定义一个函数，用于将指定的文件块读取并写入到写入流中
function pipeFile(index) {
  // 获取文件块的路径
  const chunkPath = path.resolve(chunkDir, chunks[index]);
  // 创建一个读取流，用于读取文件块的内容
  const readStream = fs.createReadStream(chunkPath);

  // 当读取流读取完文件块的内容后，执行以下操作
  readStream.on('end', () => {
    // 删除已经读取的文件块
    fs.unlinkSync(chunkPath);
    // 如果还有未读取的文件块，那么继续读取下一个文件块
    if (index + 1 < chunks.length) {
      pipeFile(index + 1);
    } else {
      // 如果所有的文件块都已经读取完，那么删除文件块目录，并发送响应
      fs.rmdirSync(chunkDir);
      res.end('file merged');
    }
  });

  // 将读取流的内容写入到写入流中
  readStream.pipe(writeStream, { end: false });
}

// 开始读取第一个文件块
pipeFile(0);
});

app.listen(3000);