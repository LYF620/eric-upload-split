import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import React, { useState, useRef } from 'react';

const SIZE = 1024 * 1024; // 文件块的大小

function App() {

  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const { name, size } = file;
    const chunkCount = Math.ceil(size / SIZE);
    const hash = Date.now().toString();

    for (let i = 0; i < chunkCount; i++) {
      const start = i * SIZE;
      const end = start + SIZE;
      const chunk = file.slice(start, end);
      // formData 用于发送文件或二进制数据
      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('index', i);
      formData.append('hash', hash);
      await axios.post('http://localhost:3000/upload', formData);
    }

    const mergeFormData = new FormData();
    mergeFormData.append('filename', name);
    mergeFormData.append('hash', hash);

    await axios.post('http://localhost:3000/merge', {type: 'merge', filename: name, hash: hash});
  };

  return (
    <div className="App">
       <input ref={inputRef} type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default App;
