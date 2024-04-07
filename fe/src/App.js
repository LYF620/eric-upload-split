import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import React, { useState, useRef, useMemo, useEffect } from 'react';

const SIZE = 1024 * 1024; // 文件块的大小

function App() {

  const [file, setFile] = useState(0);
  const [upload, setUpload] = useState(0);

  const [chunks, setChunks] = useState([]);

  const inputRef = useRef(null);

  const uploadRef = useRef(null);

  const chunkCount = useMemo(() => Math.ceil(file.size / SIZE), [file.size]);

  const hashRef = useRef(Date.now().toString());

  const isPause = useRef(false);

  useEffect(() => {
    const fileChunks = []
    for (let i = 0; i < chunkCount; i++) {
      const start = i * SIZE;
      const end = start + SIZE;
      const chunk = file.slice(start, end);
      fileChunks.push(chunk);
    }
    setChunks(fileChunks)
  },[chunkCount])
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => { 
    isPause.current = false   
    console.log('chunks', chunks);
    for (let i = upload; i < chunks.length; i++) {
      // formData 用于发送文件或二进制数据
      const formData = new FormData();
      formData.append('file', chunks[i]);
      formData.append('index', i);
      formData.append('hash', hashRef.current);
      try{
        await axios.post('http://localhost:3000/upload', formData);
        if(isPause.current) {
          console.log('pause')
          break
        }
      }catch{
        break
      }finally{
        setUpload(i)
      }
    }
  };

  useEffect(() => {
   if(upload && (upload + 1) == chunks.length){
    axios.post('http://localhost:3000/merge', {type: 'merge', filename: file.name, hash: hashRef.current});
   }
  },[upload, chunks.length, file.name])

  const handlePause = () => {
    setTimeout(() => {
      console.log(' i am pause')
      isPause.current = true
    }, 0);
  }

  return (
    <div className="App">
       <input ref={inputRef} type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <button onClick={handlePause}>Pause</button>

      <h2>上传进度为：{upload * SIZE } / {file.size}</h2>
    </div>
  );
}

export default App;
